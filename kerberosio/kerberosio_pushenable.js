[Unit]
Description=Kerberos.io - Recording status and push enabler

[Service]
ExecStart=/usr/bin/nodejs /etc/opt/kerberosio/listener/pushenable.js 12 32 24 16
WorkingDirectory=/etc/opt/kerberosio/listener
Restart=always
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=kerberosio_pushenable
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
