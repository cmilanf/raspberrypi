/*********************************************************
*            Kerberos.io 2.0 Push Button                 *
*     Carlos Milán Figueredo http://www.hispamsx.org     *
**********************************************************
* This is push button and led implementation for         *
* kerberos.io. It allows to enable or disable recording  *
* from an external button using GPIO.                    *
*                                                        *
* It will also provide led status guidance. Requires     *
* 'onoff' NodeJS addon.                                  *
**********************************************************/

require('date-utils');
var exec = require('child_process').exec;
// How many seconds to run a recording status check.
// This is intended in case the recording is changed from web interface
// and leds must be changed accordingly.
var checkSeconds = 1800;
// When the button is pressed, how many seconds to wait before start
// recording? It only applies to activation. Deactivation is immediate.
var activationSeconds = 30;

if(process.argv.length <= 3) {
	console.log("Usage: " + __filename + " <button_gpio> <led1_gpio> <led2_gpio> <buz_gpio>");
	console.log("All GPIO ports are in BCM format.");
	process.exit(-1);
}

var time1 = new Date();

// List of GPIO ports
var buttonPort = process.argv[2];
var led1Port = process.argv[3];
var led2Port = process.argv[4];
var buzPort = process.argv[5];
var Gpio = require('onoff').Gpio,
	button=new Gpio(buttonPort, 'in', 'both'),
	led1=new Gpio(led1Port, 'out'),
	led2=new Gpio(led2Port, 'out'),
	buz=new Gpio(buzPort, 'out');
// Yup, we want to log
var winston = require('winston');
var fs = require('fs');
// The kerberos.io machinery status file. This file is monitored in order
// to know if the recording must be enabled or not. Modifying this file
// allows us to enable or disable it on the fly.
var statusFile = '/etc/opt/kerberosio/config/condition.xml'
// Current recording status. Initally 'undefined' (we don't know)
var status;
// timerId is used for cancelling a pending activation request
var timerId=null;

// getRecordingStatus() reads statusFile and checks whatever "Active"
// condition is enabled or not. This is authoritative in the kerberos.io
// recording.
function getRecordingStatus()
{
	try {
		data = fs.readFileSync(statusFile, 'utf8');
	} catch (err) {
		winston.log('error', 'Could not open file %s', statusFile);
		return null;
	}
	var record = data.indexOf('<active type="bool">false</active>');
	if (record == -1) {
		return true;
	} else {
		return false;
	}
	winston.log('info', 'Recording status obtained, result: %s', record);
}

// setRecordingStatus(status) change the current recording status by
// modifying statusFile.
function setRecordingStatus(status)
{
	var result;

	try {
                data = fs.readFileSync(statusFile, 'utf8');
        } catch (err) {
                winston.log('error', err);
                return null;
        }
        if(status) {
		result=data.replace('<active type="bool">false</active>','<active type="bool">true</active>');
	} else {
		result=data.replace('<active type="bool">true</active>','<active type="bool">false</active>');
	}
	
	try {
		fs.writeFileSync(statusFile, result, 'utf8');
		winston.log('info', 'File writen with new recording status.');
		// Kerberos.io machinery service should be monitoring file changes through Guard C++
		// file watcher, but for some reason fails to notice changes in conditions.xml.
		// Here I'm forcing a service restart in order to get the new configuration.
		// I hope to change this to a more efficient approach in the future.
		exec('systemctl restart kerberosio');
		winston.log('info', 'Kerberos.io machinery service restarted');
	} catch (err) {
	        winston.log('error', err);
                return null;
        }
	
	return 0;
}

// switchRecordingStatus() will set recording to enable if disabled
// and viceversa.
function switchRecordingStatus()
{
	if (getRecordingStatus()) {
		setRecordingStatus(false);
	} else {
		setRecordingStatus(true);
	}
}

// setStatusLed(num, status) will set leds accordingly the recording status
function setStatusLed(num, status)
{
	switch(num)
	{
		case 1:
			led1.write(status);
			winston.log('info','Led 1 set with %s', status);
			break;
		case 2:
			led2.write(status);
			winston.log('info','Led 2 set with %s', status);
			break;
	}
}

// getStatusBeep(status) will beep depending on the recording status
function getStatusBeep(status)
{
	if(!status) {
                repeatBeep(1, 1000);
        } else {
                repeatBeep(6, 500);
        }
}

// repeatBeep(num, delay) makes a number of beeps by recursive calling
function repeatBeep(num, delay)
{
	if(num >= 0)
	{
		setTimeout(function() {
			buz.write(num % 2);
			repeatBeep(num-1, delay);
		}, delay);
	}
}

// *** PROGRAM START ***

// Logging
winston.add(winston.transports.File, { filename: '/var/log/kerberosio_pushenable.log' });
winston.log('info', 'Switch recording button program initialized');
winston.log('info', 'Monitoring button...');

status=getRecordingStatus();
winston.log('info', 'Current recording status is %s', status);
setStatusLed(1,status | 0);
setStatusLed(2,status | 0);

// Let's get notified whatever the button is pushed
button.watch(function (err, value) {
	if (err) {
		throw err;
	}
	// Humans usually push a button for about 500ms before the finger is back.
	// During that time, lots of calls are made. We only want one call :)
	var time2 = new Date();
        var timeBetween = time1.getSecondsBetween(time2);
	if (timeBetween > 2)
	{
		// Let's give the user the posibility of canceling an ongoing activation
		if(timerId != null)
		{
			clearTimeout(timerId);
			timerId=null;
			getStatusBeep(false);
			return 0;
		}
		status = getRecordingStatus(); // First step is to get current status (it could has changed from web interface)
		winston.log('info', 'Button pressed! Changing current recording status from %s to %s...', status, !status);
		setStatusLed(1,!status | 0); // Set leds accordingly
		getStatusBeep(!status); // Let's beep to give the user feedback of on going activation or deactivation
		// We don't want to start recording as soon as button is pressed (would catch us going out of home).
		// We will wait the activationSeconds in order to start.
		timerId=setTimeout(function() {
			setRecordingStatus(!status); // The actual recording change
			status = getRecordingStatus();
			setStatusLed(2,status | 0);
			winston.log('info', 'New recording status is %s', status);
			repeatBeep(2,500);
		},activationSeconds * 1000 * !status);
	} else {
		winston.log('info', 'Button was pressed, but no action taken due to time between: %s', timeBetween);
	}
	time1 = time2;
});

// As recording status could change from the web interface, it's a good idea to take
// a look to the file from time to time and update leds.
setInterval(function(){
	status = getRecordingStatus();
	setStatusLed(1,status | 0);
	setStatusLed(2,status | 0);
	winston.log('info', 'Current recording status was just checked. Current status: %s', status);
}, checkSeconds*1000);

// Before exiting, let's free all the GPIO resources
process.on('SIGINT', function() {
	winston.log('warn', 'SIGINT received! Freeing resources...');
	button.unexport();
	led1.unexport();
	led2.unexport();
	buz.unexport();
	process.exit(0);
});

