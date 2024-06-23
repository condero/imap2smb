# imap2smb

## Bauen Sie das Docker-Image:
docker build -t fax-email-processor .

## Führen Sie den Container aus:
docker run -d --name fax-processor fax-email-processor

## Um die Logs zu überprüfen:
docker logs -f fax-processor
