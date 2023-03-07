# n8n-nodes-cloudconvert

![logo](./nodes/CloudConvert/cloudconvert-logo.png)

[![npm version](https://badge.fury.io/js/n8n-nodes-cloudconvert.svg)](https://badge.fury.io/js/n8n-nodes-cloudconvert)

[![.github/workflows/publish-npm.yml](https://github.com/Yann-J/n8n-nodes-cloudconvert/actions/workflows/publish-npm.yml/badge.svg)](https://github.com/Yann-J/n8n-nodes-cloudconvert/actions/workflows/publish-npm.yml)

This is an n8n community node. It lets you use [_CloudConvert_](https://cloudconvert.com) in your n8n workflows.

[_CloudConvert_](https://cloudconvert.com) is an online service providing all sorts of file processing / transformation features, that can be used to convert or tweak PDFs, images, ebooks, audio, documents, etc...

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  <!-- delete if no auth needed -->  
[Compatibility](#compatibility)  
[Usage](#usage)  <!-- delete if not using this section -->  
[Resources](#resources)  

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Operations

- Jobs:
  - Create (sync or async)
  - List
  - Get One
  - Delete

## Credentials

Authentication relies on an API key that you can generate from your CloudConvert [dashboard](https://cloudconvert.com/dashboard). Both live and [sandbox](https://sandbox.cloudconvert.com) environments are supported. You will likely need the `task.read` and `task.write` scopes.

## Compatibility

Tested on n8n 0.206.1

## Usage

Note that it's strongly recommended to perform your tests against the sandbox environment, which needs to be enabled first and which uses a separate API key. Note that:

- Separate credentials should be created for the live and sandbox environments.
- The main limitation of the sandbox environment is that all imported files need to be whitelisted first before processing (based on the file's `md5` hash).

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [CloudConvert API Docs](https://cloudconvert.com/api/v2)
- [The CloudConvert Visual Job Builder](https://cloudconvert.com/api/v2/jobs/builder#) which can be used to build the job definition JSON

## TODO

- Trigger node, handling webhooks
