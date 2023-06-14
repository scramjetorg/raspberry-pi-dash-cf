# Running STH (Scramjet Transform Hub) on Raspberry Pi

 🚀 + <img width="2%" src="https://user-images.githubusercontent.com/81818614/219020422-56b87af7-fb08-4de3-9a92-b95c550fc834.svg"> ? Why not!

# Prerequesities (recommended):

- RaspberryPi
- Owned domain

|                                                        |
|--------------------------------------------------------|
| Owning domain is not necessary. CloudFlare could expose tunnel on random generated CloudFlare domain, but these "not named" tunnels that have no expiration guarantee. |


 # Table of contents <!-- omit in toc -->

- [Running STH (Scramjet Transform Hub) on Raspberry Pi](#running-sth-scramjet-transform-hub-on-raspberry-pi)
- [Prerequesities (recommended):](#prerequesities-recommended)
  - [Introduction](#introduction)
  - [Installation :clamp:](#installation-clamp)
  - [Start STH :checkered\_flag:](#start-sth-checkered_flag)
- [Add domain to CloudFlare](#add-domain-to-cloudflare)
- [Set up CloudFlare tunnel](#set-up-cloudflare-tunnel)
  - [Step 1: Download and Install Cloudflared (any machine with terminal)](#step-1-download-and-install-cloudflared-any-machine-with-terminal)
  - [Step 2: Generate an Authenticated Tunnel Certificate](#step-2-generate-an-authenticated-tunnel-certificate)
  - [Step 3: Configure the Tunnel](#step-3-configure-the-tunnel)
- [Set up the server and provider](#set-up-the-server-and-provider)
  - [Server](#server)
  - [Provider](#provider)
- [Testing](#testing)
  - [FAQ Troubleshooting :collision:](#faq-troubleshooting-collision)
    - [Why my computer doesn't see the Raspberry?](#why-my-computer-doesnt-see-the-raspberry)
    - [I made some changes in my code, how to rebuild the sequence?](#i-made-some-changes-in-my-code-how-to-rebuild-the-sequence)
  - [Dictionary :book:](#dictionary-book)

 ## Introduction

Scramjet Sequences don't require high hardware requirements. You can run it also on cheap single-board computers for example Raspberry Pi <img width="1.2%" src="https://user-images.githubusercontent.com/81818614/219020422-56b87af7-fb08-4de3-9a92-b95c550fc834.svg"> The following configuration was tested on Raspberry Pi Zero 2 W booted in headless mode with 64-bit image (5.15 kernel). In this example we will capture some internal parameters of RPi in real time.

How to boot rPi? -> [official video](https://www.youtube.com/watch?v=ntaXWS8Lk34&feature=youtu.be)


## Installation :clamp:

First You should install node.js (we recommend 16.x):
```
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
```
```
sudo apt-get install -y nodejs
```
then install our STH and CLI:

```
sudo npm i -g @scramjet/sth @scramjet/cli
```

Verify installation:
```
node -v
si -v
```

## Start STH :checkered_flag:

Create sth_rpi_config.json:
```
{
    "runtimeAdapter": "process",
    "safeOperationLimit": 128,
    "instanceRequirements": { "freeMem": 64 }
}
```

**or** sth_rpi_config.yml:

```
safeOperationLimit: 128
runtimeAdapter: process
instanceRequirements:
    freeMem: 64
```

and launch Scramjet Transform Hub
```
sth --config /path/to/config/sth_rpi_config.json
```
:bulb: Note: As default hub reserves 512MB of RAM, if your raspberry has 1GB or more, you can try run sth without custom memory limits

# Add domain to CloudFlare

If You have a domain regitered somewhere else than on CloudFlare pls reffer to (https://developers.cloudflare.com/learning-paths/get-started/#live_website)

# Set up CloudFlare tunnel

Introduction:

Cloudflare allows users to create tunnels, which provide secure and encrypted connections between your local machine and Cloudflare's network.
In this section we will explain how to use it to expose Dashboard provided by Sequence (`ser-seq`). We make it available on custom domain.

## Step 1: Download and Install Cloudflared (any machine with terminal)

Visit the Cloudflared releases page on GitHub (https://github.com/cloudflare/cloudflared/releases).
Download the appropriate version of Cloudflared for your operating system (Windows, macOS, or Linux).
Install Cloudflared by following the instructions provided for your operating system.

## Step 2: Generate an Authenticated Tunnel Certificate

Open your command-line interface.
Navigate to the directory where Cloudflared is installed.
Run the following command to generate an authenticated tunnel certificate:

```bash
./cloudflared tunnel login
```

Follow the on-screen instructions to complete the authentication process. This step will generate a certificate and a Cloudflare configuration file.

## Step 3: Configure the Tunnel

Run the following command to create a new configuration file:

```shell
cloudflared tunnel create <tunnel-name>
```

Replace <tunnel-name> with a name of your choice to identify the tunnel.

A <tunnel-name>.json file with tunnel credentials will be created.
Copy this file to `./raspberry-pi/ser-seq/.cloudflared` folder.

Note: Instance will scan ./cloudflared folder and use first .json found to run a tunnel.


# Set up the server and provider

clone this git repository:

```bash
git clone git@github.com:scramjetorg/raspberry-pi-dash-cf.git
```

Start by personalizing the code to your device:
```bash

cd raspberry-pi/ser-seq/client/src/
```

## Server

Install dependencies and build a static folder for server:

```bash
npm run build           # build static folder

```

You can deploy a hosting sequence :rocket: :

```bash
si seq deploy raspberry-pi/ser-seq/dist   # Be sure to execute this command while being in a directory that contains the "ser-seq" folder
```
If launched correctly, the transfom hub terminal will display the message "Listening on port 3000"

## Provider

Enter the directory of the parameter-reading sequence deploy the sequence! :rocket: :

```bash
si seq deploy rasperry-pi/rpi-seq/dist
```

now the Instance of your Sequence is running and producing to "pi" topic, you can verify that by launching topic listener :ear: via CLI:

```bash
si topic get pi
```

you should see similar output:

```
[38.63, 8.35, 0.25]
[39.17, 8.35, 0.24]
[38.63, 8.35, 0.24]
[38.63, 8.35, 0.24]
```

these values are respectively: chip temperature in Celcius degrees, disk usage and average CPU load.

:bulb: Note: If you want to dig in, there is [full STH documentation](https://github.com/scramjetorg/platform-docs)

# Testing

Now you can monitor the parameters of your device by connecting in your browser to its address.
![image](https://user-images.githubusercontent.com/85632612/241807654-21146f47-a473-46c0-9f95-79b1aac3447a.png)

## FAQ Troubleshooting :collision:

### Why my computer doesn't see the Raspberry?

Raspberry Team have removed default user. If you created image with non official imager (eg. balenaEtcher), you need to create userconf.txt (in the boot root directory) and add the following line:
```
pi:$6$/XOZsG1X0IAbhXB0$wYZHRkvib0SUKQA3KVAxofPR.JsFAbI2NCue2znGvhRsQobVdllFXyQZ7fMSvAoyEj8MfHtkMeSZT7IRIixg01

```
this step will enable default user (user: pi, password: raspberry).

:bulb: We recommend using the official imager


### I made some changes in my code, how to rebuild the sequence?

There are two ways, you can force rebuild with `npm run build --upgrade` or manually remove `/dist` directory and do simple `npm run build`.

## Dictionary :book:

- STH - Scramjet Transform Hub
- Sequence - program adapted to run in STH environment
- Instance - running Sequence
- Topics - are named buses over which Instances exchange messages
- si - Scramjet Command Line Interface
