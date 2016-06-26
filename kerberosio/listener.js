/*********************************************************
*            Kerberos.io 2.0 TCP Listener                *
*     Carlos Milán Figueredo http://www.hispamsx.org     *
**********************************************************
* This is a modified version of the node.js TCP listener *
* you can find at:                                       *
*                                                        *
* https://doc.kerberos.io/2.0/addons/TCP_Listener        *
*                                                        *
* It will perform 3 actions on movement detection:       *
*    - Beep a PC Speaker attached to BCM_GPIO 13         *
*    - Send a Slack message to channel #general          *
*    - Send a email with the capture picture attached    *
*                                                        *
* Variables to modify:                                   *
*    - SLACK_WEBHOOK_URL                                 *
*    - slackData                                         *
*    - smtpConfig                                        *
*    - mailData                                          *
*    - capturePath                                       *
**********************************************************/

// Import libraries
var net = require('net');
var SLACK_WEBHOOK_URL = '';
var slack = require('slack-notify')(SLACK_WEBHOOK_URL);
var winston = require('winston');
var nodemailer = require('nodemailer');
require('date-utils');
var exec = require('child_process').exec;
var helpers = require('./helpers');

// Variables
var listenerPort = 1337;
var time1 = new Date();
var slackData = {
	channel: '#general',
        icon_url: '',
        text: '',
        unfurl_links: 0,
        username: 'mad-raspi-cam0'
};
var capturePath = '/etc/opt/kerberosio/capture/';
var lastCaptureFile;
var smtpConfig = {
        host: 'smtp.sendgrid.net',
        port: 465,
        secure: true,
        auth: {
                user: '',
                pass: ''
        }
};
var mailData = {
	from: 'raspi0@hispamsx.org',
	to: 'aaaaa@hispamsx.org',
	subject: '',
	text: '',
	attachments: [
		{
			filename: 'picture.jpg',
			path: capturePath
		}
	]
};
var smtp = nodemailer.createTransport(smtpConfig);

// Logging
winston.add(winston.transports.File, { filename: '/var/log/kerberosio_listener.log' });
slack.onError = function(err) {
    winston.log('error', 'Slack API error: %s', err);
};
//winston.remove(winston.transports.Console);
winston.log('info', 'Kerberos.io listener initialized at port %d', listenerPort);

// Starting socket listening
net.createServer(function (socket)
{
    winston.log('info','Socket opened, waiting for incoming connections...');
    // Handle incoming messages from the magnet controller.
    socket.once('data', function (data)
    {
        var time2 = new Date();
        var timeBetween = time1.getSecondsBetween(time2);
        winston.log('info','Incoming packet. Time between is: %d', timeBetween);
        if(timeBetween > 2)
        {
            winston.log('info', 'Beeping...');
            exec('/etc/opt/kerberosio/listener/beepmotion.sh 13');
	    if(timeBetween > 30)
            {
                winston.log('info', 'Sending Slack notification...');
                slack.send(slackData);
		winston.log('info', 'Getting lastest capture picture...');
		// I think this is not robust enoguh, specially for SMB shares, hence
		// I'm wrapping in a try-catch
		try {
			lastCaptureFile = helpers.getNewestFile(capturePath, new RegExp('.*\.jpg'));
			winston.log('info', 'Sending MAIL notification with picture: %s', lastCaptureFile);
			mailData.attachments[0].filename = lastCaptureFile;
			mailData.attachments[0].path = lastCaptureFile;
			smtp.sendMail(mailData, function(error, info) {
				if(error) {
					winston.log('error',error);
				}
			});
		} catch (err) {
			winstin.log('error', 'Failed getting newest file due to: %s', err);
		}
	     }
        }
        time1 = time2;
    });
}).listen(listenerPort);
// Put a friendly message on the terminal of the server.
//console.log("Kerberos.io listener running at port 1337\n");
