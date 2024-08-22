const MailParser = require('mailparser').MailParser;
const Mbox = require('./src/mbox');
const fs = require('fs');
const path = require('path');
const { format } = require('date-fns');

const mbox = new Mbox();
const uniqueContacts = new Set();

const currentDate = new Date();
const formattedDate = format(currentDate, "yyyy-MM-dd_HH-mm-ss");
const resultsDir = path.join(__dirname, '../results', formattedDate);
const contactsDir = path.join(resultsDir, 'contacts');
const messagesDir = path.join(resultsDir, 'messages');

fs.mkdirSync(contactsDir, { recursive: true });
fs.mkdirSync(messagesDir, { recursive: true });

let messageCounter = 0;

function saveContacts() {
    const filePath = path.join(contactsDir, 'contacts.txt');
    fs.writeFileSync(filePath, Array.from(uniqueContacts).join('\n'), 'utf8');
    console.log(`Kontakty zapisane do: ${filePath}`);
}

function saveMessage(content, subject, contact, index) {
    if (!content) {
        console.error(`Nie udało się zapisać wiadomości ${index} dla kontaktu ${contact}: brak treści.`);
        return;
    }

    const sanitizedSubject = subject.replace(/[<>:"/\\|?*]+/g, '');
    const sanitizedContact = contact.replace(/[<>:"/\\|?*]+/g, '');
    const fileName = `${sanitizedContact}_message_${index}_${sanitizedSubject || 'no_subject'}.txt`;
    const filePath = path.join(messagesDir, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Wiadomość zapisana do: ${filePath}`);
}

function processHeaders(headers) {
    const allAddresses = new Set();
    
    const toAddresses = headers.get('to');
    if (toAddresses && Array.isArray(toAddresses.value)) {
        toAddresses.value.forEach(addressObj => {
            const email = addressObj.address;
            if (email) allAddresses.add(email);
        });
    }

    const ccAddresses = headers.get('cc');
    if (ccAddresses && Array.isArray(ccAddresses.value)) {
        ccAddresses.value.forEach(addressObj => {
            const email = addressObj.address;
            if (email) allAddresses.add(email);
        });
    }

    const bccAddresses = headers.get('bcc');
    if (bccAddresses && Array.isArray(bccAddresses.value)) {
        bccAddresses.value.forEach(addressObj => {
            const email = addressObj.address;
            if (email) allAddresses.add(email);
        });
    }

    return Array.from(allAddresses);
}

mbox.on('message', function(msg) {
    let subject = 'No Subject';
    let mailparser = new MailParser({ streamAttachments: true });

    mailparser.on('headers', function(headers) {
        const addresses = processHeaders(headers);
        addresses.forEach(email => uniqueContacts.add(email));
        subject = headers.get('subject') || 'No Subject';
    });

    mailparser.on('data', data => {
        if (data.type === 'text') {
            const addresses = processHeaders(mailparser.headers || {});
            const contact = addresses[0] || 'no_contact';
            saveMessage(data.text, subject, contact, messageCounter++);
        }
    });

    mailparser.on('end', () => console.log(`Wiadomość o temacie "${subject}" przetworzona.`));
    mailparser.on('error', err => console.error('Błąd podczas parsowania wiadomości:', err));

    mailparser.write(msg);
    mailparser.end();
});

mbox.on('end', saveContacts);
process.stdin.pipe(mbox);
