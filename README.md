# Introduction
This repository contains several experiments in the form of bash scripting and NodeJS code that I'm using with my Raspberry Pi 3. My main Raspberry Pi use is building a low-cost home surveillance system with the help of the lightweight [kerberos.io](http://kerberos.io) software.

# The [kerberos.io](http://kerberos.io) surveillance system
This is actually composed of quite few elements:

* Raspberry Pi 3 board
* Raspberry NoIR camera v2
* An infrared light so the camera can record in full darkness
* A [PC Speaker](https://en.wikipedia.org/wiki/PC_speaker), do not confuse with desktop speakers

This repository is divied in folders.

# kerberosio
[kerberos.io](http://kerberos.io) is able to perform several action when motion is detected, that by default is saving a picture to disk, calling a webhook, enabling a GPIO signal or sending a TCP message. Last one is a good candidate to build custom actions upon motion detection.

When motion is detected, I though it would be good to:

* Beep the PC Speaker.
* Send a [Slack](http://slack.com) push notification
* Send an email with the captured picture attached

This is fairly easy to implement with the [kerberos.io example of TCP Listener](https://doc.kerberos.io/2.0/addons/TCP_Listener), a simple NodeJS program that listen a TCP port for messages sent by kerberos.io, executing whatever actions we want to.

I modified the example program in order to perform the three mentioned actions. These are the files involved:

* **listener.js**. The main program. Wait for TCP message reception and then beeps, search for latest captured image, send Slack push notification and email with picture attached.
* **helper.js**. Helper functions that allow to determine the most recent file in a folder.
* **beepmotion.sh**. It's a script that beeps the PC Speaker via GPIO.
* **kerberosio_listener.service**. A systemd configuration file for starting the listerner at boot time.
* **pushenable.js**. kerberos.io is great, but having to enter the portal in order to enable or disable movement capture was really incovinient. This small program implements physical button enable/disable of the system, giving feedback through 2 LEDs and 1 buzzer (not the PC Speaker one).

#pcspeaker
Playing with the PC Speaker is fun. I though I could emulate the Big Ben clock sound with the GPIO PC Speaker. I didn't know anything of what signaling a PC Speaker needed in order to sound, but [Dale Mitchel](https://github.com/DaleMitchell/pcspkr_keyboard) Github repository came into rescue. I modified the script, changing the interactive input with a fixed one and put some friendly vars resembling musical notes. The files here:

* **bigbensound.sh**. It will play the Big Ben sound depending current system clock.
* **tone.sh**. Just for testing, it will play the tone given by command line.

Putting **bigbensound.sh** in your CRON each 15 minutes will give you a nice Big Ben emulator. I'm actually looking for other clock tones.

[![YouTube video link](https://img.youtube.com/vi/kgHkgoH74sA/0.jpg)](https://www.youtube.com/watch?v=kgHkgoH74sA)
