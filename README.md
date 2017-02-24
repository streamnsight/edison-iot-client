# Setting up the board

You'll need to have setup the WiFi network for the board before you can do anything.
You can do this through a UI if you get the software, or you can do it through USB serial communication on the terminal.

## Set up WiFi

### With the UI: get the Edison board SDK for your OS:

https://software.intel.com/en-us/iot/hardware/edison/downloads

- Configure WiFi
- Configure hostname and SSH

### With command line

Depending on your OS, follow these instruction:
https://software.intel.com/en-us/setting-up-serial-terminal-intel-edison-board


You should then have access to the IP address of the board and be able to SSH to it.

to connect to the board:

`ssh root@<IP_OF_BOARD>`

## Setup the code on the board

There are several ways to get the code on the board:
ssh to the board and git clone the repository. You'll have the code on the board.

If you want to edit remotely, the easiest way to setup the code on the board and be able to edit it on your laptop, is to use `sshfs`

`sshfs` will mount the device file system on your laptop (like a share drive) and you can then clone the code into the folder

### Install SSHFS

On a Mac:

download and install:

https://github.com/osxfuse/sshfs/releases

On Windows:

Download https://code.google.com/archive/p/win-sshfs/
OR, try: https://github.com/Foreveryone-cz/win-sshfs/releases

### Mount a folder
- Navigate to a location where you want to mount the remote folder.
- Create the folder to mount on (e.g. `sshfs_folder`)
- Create the folder where you want the code to go on the board, via `ssh`
- Then mount the remote folder on your laptop local folder
```bash
# create folder to mount on
mkdir -p sshfs_folder
# create remote folder to put the code in, over ssh (send mkdir command over ssh)
ssh root@<IP_OF_BOARD> 'mkdir ~/edison-client'
# mount the folder locally with sshfs
sshfs root@<IP_OF_BOARD>:~/edison-client sshfs_folder
```

### Clone the code
You can now clone the repo into the local `sshfs_folder` folder and edit it with your favorite editor:
```bash
cd sshfs_folder
git clone https://github.com/streamnsight/edison-iot-client.git
```

### Set Remote Server IP

You are almost ready to run the client data streamer. We'll be streaming to a common server.
Ask you friendly Javascript Meetup host for the IP of the server to send the data to, and set the `SERVER_IP` variable on your board

```bash
export SERVER_IP=192.168.X.XXX
```

### Run (the code)!

You can run the code by ssh'ing to the board and running:

```bash
ssh root@<IP_OF_BOARD>
# get into the folder
cd ~/edison-client
# install dependencies
npm install
# then run
node edison.js
```
