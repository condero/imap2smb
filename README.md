# IMAP2SMB

IMAP2SMB is an application designed to regularly check a specific email account for unread emails with PDF attachments and save those attachments to a network SMB drive.

## Features

- Connects to an IMAP email account
- Checks for unread emails
- Searches for emails with PDF attachments
- Downloads and saves PDF attachments to a specified SMB network drive
- Marks processed emails as read
- Handles file name conflicts by appending a counter to the file name
- Includes debug mode for troubleshooting

## Requirements

- Node.js
- Docker (for containerized deployment)

## Dependencies

- @marsaud/smb2: ^0.18.0
- base64-stream: ^1.0.0
- fs: ^0.0.1-security
- imap: ^0.8.19
- mailparser: ^3.7.1
- smbclient: ^1.0.3

## Installation

1. Clone the repository:

```git clone https://github.com/condero/imap2smb.git```
```cd imap2smb```

2. Install dependencies:

3. Create a `config.json` file in the root directory with your IMAP and SMB configurations:

```json
{
  "email": {
    "user": "your-email@example.com",
    "password": "your-email-password",
    "host": "imap.example.com",
    "port": 993,
    "tls": true
  },
  "smb": {
    "share": "\\\\server\\share",
    "domain": "your-domain",
    "username": "your-username",
    "password": "your-password"
  }
}
```

## Usage

### Running Locally
To run the application locally:

```node index.js```

### Running with Docker
Build the Docker image:

```docker build -t imap2smb .```

Run the Docker container:

```docker run -d --name imap2smb imap2smb```

Check logs the Docker container:

```docker logs -f imap2smb```

### Configuration
The application uses a config.json file for configuration. Ensure this file is properly set up with your IMAP and SMB credentials before running the application.

### Debugging
To enable debug mode, set the DEBUG environment variable to true:

```DEBUG=true node index.js```

### Cron Job
The application is set up to run every 5 minutes using a cron job within the Docker container. The cron job configuration can be found in the run.sh script.

## License
MIT

## Contributing
Contributions to IMAP2SMB are welcome. Please ensure you follow the existing code style and include appropriate tests for new features.

## Support
For issues and feature requests, please file an issue on the GitHub repository.
