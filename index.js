const Imap = require('imap');
const fs = require('fs').promises;
const path = require('path');
const SMB2 = require('@marsaud/smb2');
const config = require('./config.json');
const { simpleParser } = require('mailparser');
const { Base64Decode } = require('base64-stream');

const imapConfig = config.email;
const smbConfig = config.smb;

// Debug-Modus-Flag
const DEBUG = process.env.DEBUG === 'true' || false;

function debug(message) {
  if (DEBUG) {
    console.log('[DEBUG]', message);
  }
}

async function savePDF(buffer, fileName) {
  debug(`Entering savePDF function for file: ${fileName}`);
  const client = new SMB2({
    share: smbConfig.share,
    domain: smbConfig.domain,
    username: smbConfig.username,
    password: smbConfig.password
  });

  try {
    debug(`Attempting to save file: ${fileName}`);
    let filePath = path.join('fax', fileName);
    let fileNameWithoutExt = path.parse(fileName).name;
    let fileExt = path.parse(fileName).ext;
    let counter = 1;

    while (true) {
      try {
        debug(`Trying to write file: ${filePath}`);
        await client.writeFile(filePath, buffer, { flag: 'wx' });
        console.log(`Saved: ${filePath}`);
        debug('File saved successfully');
        break;
      } catch (error) {
        if (error.code === 'STATUS_OBJECT_NAME_COLLISION') {
          debug(`File ${filePath} already exists, trying a new name`);
          filePath = path.join('fax', `${fileNameWithoutExt}_${counter}${fileExt}`);
          counter++;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error('Error saving file to SMB:', error);
    debug(`Error details: ${JSON.stringify(error)}`);
    throw error;  // Re-throw the error to be caught in the calling function
  } finally {
    try {
      await client.disconnect();
      debug('SMB client disconnected');
    } catch (error) {
      console.error('Error during SMB disconnection:', error);
      debug(`Disconnection error details: ${JSON.stringify(error)}`);
    }
  }
  debug(`Exiting savePDF function for file: ${fileName}`);
}

async function processEmails() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);

    imap.once('ready', () => {
      debug('IMAP connection ready');
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          debug(`Error opening INBOX: ${err}`);
          imap.end();
          return reject(err);
        }

        debug('INBOX opened');
        imap.search(['UNSEEN'], async (err, results) => {
          if (err) {
            debug(`Error searching for UNSEEN messages: ${err}`);
            imap.end();
            return reject(err);
          }

          debug(`Found ${results.length} UNSEEN messages`);
          if (results.length === 0) {
            console.log('No new messages');
            imap.end();
            return resolve();
          }

          const f = imap.fetch(results, { bodies: [''], struct: true });

          f.on('message', (msg) => {
            debug('Processing a message');
            let uid;

            msg.once('attributes', (attrs) => {
              uid = attrs.uid;
              debug(`Message UID: ${uid}`);
            });

            msg.on('body', async (stream, info) => {
              try {
                const parsed = await simpleParser(stream);
                debug(`Parsed email. Found ${parsed.attachments.length} attachments`);

                let pdfExported = false;

                for (let attachment of parsed.attachments) {
                  if (attachment.contentType === 'application/pdf') {
                    const date = new Date(parsed.date);
                    const formattedDate = date
                      .toISOString()
                      .replace(/T/, " ")
                      .replace(/:/g, "-")
                      .replace(/\..+/, "");
                    const fileName = `Fax - ${formattedDate}.pdf`;
                    
                    debug(`Preparing to save attachment: ${fileName}`);
                    debug(`Attachment data length: ${attachment.content.length}`);

                    try {
                      await savePDF(attachment.content, fileName);
                      pdfExported = true;
                    } catch (error) {
                      console.error(`Error saving PDF ${fileName}:`, error);
                      debug(`Save PDF error details: ${JSON.stringify(error)}`);
                    }
                  }
                }

                if (pdfExported && uid) {
                  debug(`Marking message ${uid} as read`);
                  imap.addFlags(uid, ['\\Seen'], (err) => {
                    if (err) {
                      console.error(`Error marking message ${uid} as read:`, err);
                    } else {
                      debug(`Message ${uid} marked as read`);
                    }
                  });
                }
              } catch (error) {
                console.error('Error parsing email:', error);
                debug(`Parse error details: ${JSON.stringify(error)}`);
              }
            });
          });

          f.once('error', (err) => {
            console.log('Fetch error: ' + err);
            debug(`Fetch error details: ${JSON.stringify(err)}`);
          });

          f.once('end', () => {
            console.log('Done fetching all messages!');
            debug('Fetch process ended');
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err) => {
      console.error('IMAP connection error:', err);
      debug(`IMAP error details: ${JSON.stringify(err)}`);
      reject(err);
    });

    imap.once('end', () => {
      console.log('Connection ended');
      debug('IMAP connection ended');
      resolve();
    });

    imap.connect();
    debug('Attempting to connect to IMAP server');
  });
}

async function main() {
  try {
    debug('Starting email processing');
    await processEmails();
    console.log('Email processing completed');
    debug('Email processing completed successfully');
  } catch (error) {
    console.error('An error occurred:', error);
    debug(`Main function error: ${JSON.stringify(error)}`);
  }
}

main();
