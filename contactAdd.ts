const { PrismaClient } = require("@prisma/client");
const puppeteer = require("puppeteer");
export const prisma = new PrismaClient();

const addContacts = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/usr/bin/google-chrome",
  });
  const hamburgerMenuButtonClass =
    "#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button > div";
  const contactsButtonClass =
    "#column-left > div > div > div.sidebar-header.can-have-forum > div.sidebar-header__btn-container > button > div.btn-menu.bottom-right.has-footer.active.was-open > div:nth-child(4)";
  const addContactButtonClass =
    "#contacts-container > div.sidebar-content > button";
  const firstNameInputClass =
    "body > div.popup.popup-create-contact.popup-send-photo.popup-new-media.active > div > div.name-fields > div.input-field.input-field-name > div.input-field-input.is-empty";
  const lastNameInputClass =
    "body > div.popup.popup-create-contact.popup-send-photo.popup-new-media.active > div > div.name-fields > div:nth-child(2) > div.input-field-input.is-empty";
  const phoneNumberInputClass =
    "body > div.popup.popup-create-contact.popup-send-photo.popup-new-media.active > div > div.input-field.input-field-phone > div.input-field-input";
  const confirmAddContactClass =
    "body > div.popup.popup-create-contact.popup-send-photo.popup-new-media.active > div > div.popup-header > button.btn-primary.btn-color-primary";
  const popupClass = "popup-container";
  const popupCloseClass =
    "body > div.popup.popup-create-contact.popup-send-photo.popup-new-media.active > div > div.popup-header > button.btn-icon.popup-close";

  const contactList = await getContactsList();
  const uniqueContactsMap = new Map();

  for (let i = 0; i < contactList.length; i++) {
    const contact = contactList[i];
    const { number } = contact;

    if (!uniqueContactsMap.has(number)) {
      uniqueContactsMap.set(number, i);
    }
  }

  console.log(uniqueContactsMap.size);

  const uniqueCombinations = Array.from(uniqueContactsMap.entries()).map(
    ([number, index]) => ({ number, index })
  );

  console.log(uniqueCombinations);
  const page = await browser.newPage();
  await page.setViewport({
    width: 1700, // Your desired width
    height: 800, // Your desired height
  });
  await page.goto("https://web.telegram.org/k");
  await page.waitForSelector(hamburgerMenuButtonClass);
  await page.click(hamburgerMenuButtonClass);

  await page.waitForSelector(contactsButtonClass);
  await page.click(contactsButtonClass);
  console.log(uniqueCombinations.length);
  for (const lead in uniqueCombinations) {
    console.log(contactList[uniqueCombinations[lead].index]);

    await page.waitForSelector(addContactButtonClass);
    await page.waitForTimeout(500);
    await page.click(addContactButtonClass);

    await page.waitForSelector(firstNameInputClass);
    await page.type(
      firstNameInputClass,
      contactList[uniqueCombinations[lead].index].number
    );
    await page.type(
      lastNameInputClass,
      contactList[uniqueCombinations[lead].index].name || ""
    );

    await page.evaluate((phoneNumberInputClass: any) => {
      const phoneInput = document.querySelector(phoneNumberInputClass);
      phoneInput.innerText = "";
    }, phoneNumberInputClass);
    await page.type(
      phoneNumberInputClass,
      contactList[uniqueCombinations[lead].index].number
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));
    await page.click(confirmAddContactClass);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const closeButton = await page.$(popupCloseClass);
    if (!closeButton) {
      await prisma.contact_list.update({
        where: {
          id: contactList[uniqueCombinations[lead].index].id,
        },
        data: {
          is_added: true,
          created_at: new Date(),
        },
      });
    }
    if (closeButton) {
      await page.click(popupCloseClass);
      await prisma.contact_list.update({
        where: {
          id: contactList[uniqueCombinations[lead].index].id,
        },
        data: {
          is_added: false,
          created_at: new Date(),
        },
      });
    }
  }
  await browser.close();
};

const getContactsList = async () => {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 2);
  // console.log(
  //   await prisma.contact_list.count({
  //     where: {
  //       country: "UK",
  //       is_added: false,
  //       created_at: {
  //         lt: oneDayAgo,
  //       },
  //     },
  //     orderBy: {
  //       id: "asc",
  //     },
  //   })
  // );
  return await prisma.contact_list.findMany({
    where: {
      // csv_group: 8,
      is_added: false,
      country: "UK",
      created_at: {
        lt: oneDayAgo,
      },
    },
    orderBy: {
      id: "asc",
    },
    // skip: 24000,
    // take: 8000,
  });
};

addContacts();
