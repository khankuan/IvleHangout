Ivle Hangout
Deployment Guide for Developers
(The same guide can be found in the project report)



The deployment is set up on Amazon EC2, Ubuntu OS 12.04. Amazon S3 is needed for documents hosting.


1) Setting up Firewall

Firewall rules on security group:
22 (SSH)	0.0.0.0/0
80 (HTTP) 0.0.0.0/0
443 (HTTPS) 0.0.0.0/0
8888 (Websocket) 0.0.0.0/0
 


2) Update and installing additional software

Commands entered:
sudo apt-get update
sudo apt-get install nginx-full



3) Configuration for Nginx HTTP server

Nginx setup, nginx located in /etc/nginx/nginx.conf:
Set upstream frontends ports (8888, etc..) to the same as tornado app
Might need to open those port at AWS console.

nginx.conf:

user nginx;
worker_processes 1;

error_log /var/log/nginx/error.log;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
# Enumerate all the Tornado servers here
    upstream frontends {
        server 127.0.0.1:8888;
    }
    
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    access_log /var/log/nginx/access.log;
    
    keepalive_timeout 300;
    proxy_read_timeout 300;
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    gzip on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_types text/plain text/html text/css text/xml
    application/x-javascript application/xml
    application/atom+xml text/javascript;
    
    # Only retry if there was a communication error, not a timeout
    # on the Tornado server (to avoid propagating "queries of death"
    # to all frontends)
    proxy_next_upstream error;
    
    server {
        listen 80;
    
        # Allow file uploads
        client_max_body_size 50M;
    
        location ^~ /static/ {
            root /var/www;
            if ($query_string) {
                expires max;
            }
        }
            
        location = /favicon.ico {
            rewrite (.*) /static/favicon.ico;
        }
            
        location = /robots.txt {
            rewrite (.*) /static/robots.txt;
        }
    
        location / {
            proxy_pass_header Server;
            proxy_set_header Host $http_host;
            proxy_redirect false;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Scheme $scheme;
            proxy_pass http://frontends;
        }
    }
}



4) Start Application

(Copy deployment folder to "~/")
cd HangoutApp
screen python app.py



5) Configuration File

The config file is available in the config folder.
It follows a format of: ITEM=VALUE
Several configurations are required: Database host, user, password, name
Available user roles in Channel:
- Admin (4)
- Co-Admin (3)
- Member (2)
- Guest (1)
- Visitor (0)
- Banned (-1)
Permission Types of a Channel
- Draw
- Chat
- Invite
- Change Topic
- Download
- Upload
- Kick
User status
- Available
- Away
- Busy
Ivle API Key
Ivle API Url
Amazon S3 Key
Amazon S3 Secret
Amazon S3 Bucket
Amazon S3 Url
Document Master Seed (For hashing of url when storing documents)