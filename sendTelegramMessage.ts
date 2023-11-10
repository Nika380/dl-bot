const { PrismaClient } = require("@prisma/client");
const axios = require("axios");
const cron = require("node-cron");

const prisma = new PrismaClient();
const API = axios.create({
  baseURL: "http://localhost:8000/",
});

const getContactList = async () => {
  try {
    const res = await API.get("/get-contacts");
    const contactList = res.data;
    const uniqueNumbersMap = new Map();
    contactList.forEach((contact) => {
      const [name, number] = contact; // Assuming the contact array has [name, number] structure

      if (!uniqueNumbersMap.has(number)) {
        uniqueNumbersMap.set(number, name);
      }
    });
    const uniqueCombinations = Array.from(uniqueNumbersMap.entries()).map(
      ([number, name]) => ({ number, name })
    );

    return uniqueCombinations;
  } catch (error) {
    console.error(error);
  }
};

let sendMessages = true;

const startSendingMessages = async () => {
  const contacts = (await getContactList()) || [];
  let successCount = 0;
  let errorCount = 0;
  let successNumbers = [];
  let errorNumbers = [];
  let duplicateCount = 0;
  let duplicateNumbers = [];

  for (const contact of contacts) {
    if (sendMessages) {
      const isDuplicate = await prisma.telegram_messages_reports.findFirst({
        where: {
          phone_number: contact.number,
        },
      });
      if (isDuplicate) {
        await prisma.telegram_messages_reports.update({
          where: {
            id: isDuplicate.id,
          },
          data: {
            is_duplicate: true,
          },
        });
        duplicateCount++;
        duplicateNumbers.push(contact);
        continue; // Skip the current iteration if it's a duplicate
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * 120)); // Wait for 20 seconds before sending the next message

      try {
        const messageText =
          "Hurry Up! \nOnly Today, Only for Limited Users, Special Promotions and Bonuses \nSign up now : https://bit.ly/3u5ocIZ";
        const res = await API.post("/send-message", {
          text: messageText,
          recipient: contact.number,
        });

        successCount++;
        successNumbers.push(contact);
        await prisma.telegram_messages_reports.create({
          data: {
            phone_number: contact.number,
            first_name: contact.name,
            is_send: true,
            created_at: new Date(),
          },
        });
        console.log(`Message Sent To ${contact.number}`);
      } catch (error) {
        errorCount++;
        errorNumbers.push(contact);
        await prisma.telegram_messages_reports.create({
          data: {
            phone_number: contact.number,
            first_name: contact.name,
            is_send: false,
            created_at: new Date(),
            error_message: error.response?.data?.detail || "",
          },
        });
        console.error(error.response?.data?.detail || "Unknown Error");
        console.log(
          `Message Did Not Sent To ${contact.number}, Because Of ${
            error.response?.data?.detail || "Unknown Error"
          }`
        );
      }
    }
  }

  console.log(`Error Count: ${errorCount}`);
  console.log(`Success Count: ${successCount}`);
  console.log(`Duplicate Count: ${duplicateCount}`);
};

// getContactList();/\
// startSendingMessages();
const stopSendingMessages = () => {
  sendMessages = false;
};

cron.schedule("0 21 * * *", async () => {
  console.log("Running startSendingMessages at 21:00");
  await API.post("/send-message", {
    text: "9 saatze dagegmili daiwyo",
    recipient: process.env.PHONE_NUMBER,
  });
  startSendingMessages();
});

cron.schedule("0 2 * * *", async () => {
  console.log("Message Sending Stopped");
  await API.post("/send-message", {
    text: "gagzavnebi shewyda",
    recipient: process.env.PHONE_NUMBER,
  });
  stopSendingMessages();
});
