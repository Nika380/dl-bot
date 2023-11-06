const { PrismaClient } = require("@prisma/client");
const puppeteer = require("puppeteer");
const prisma = new PrismaClient();
(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/usr/bin/google-chrome",
  });
  const page = await browser.newPage();
  await page.setViewport({
    width: 1700, // Your desired width
    height: 800, // Your desired height
  });
  await page.goto("https://web.telegram.org/k/");
  const channelClass =
    "#folders-container > div > div.chatlist-top.has-contacts > ul > a.row.no-wrap.row-with-padding.row-clickable.hover-effect.rp.chatlist-chat.chatlist-chat-bigger.row-big.active > div.c-ripple";
  const chatInfoClass =
    "#column-center > div > div > div.sidebar-header.topbar > div.chat-info-container > div.chat-info";
  const searchInputClass =
    "#column-right > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrolled-bottom.scrollable-y-bordered.add-members-container.active > div.sidebar-content > div > div.sidebar-left-section-container > div > div > div > div > div.selector-search > input";
  const chosenUserClass =
    "#column-right > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrolled-bottom.scrollable-y-bordered.add-members-container.active > div.sidebar-content > div > div.chatlist-container > div > div.sidebar-left-section-container.selector-list-section-container > div > div > ul > a:nth-child(1) > div.c-ripple";
  const addSelectedToChannelClass =
    "#column-right > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrolled-bottom.scrollable-y-bordered.add-members-container.active > div.sidebar-content > button > div";
  const verifyAddUsersClass =
    "body > div.popup.popup-peer.popup-add-members.active > div > div.popup-buttons > button:nth-child(1) > div";
  const editButtonClass =
    "#column-right > div > div > div.sidebar-header > div > div.transition-item.active > button > div";
  const subscribersButtonClass =
    "#column-right > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrollable-y-bordered.edit-peer-container.edit-group-container.active > div.sidebar-content > div > div:nth-child(4) > div > div > div:nth-child(2) > div.c-ripple";
  const addSubscribersButtonClass =
    "#column-right > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrolled-bottom.scrollable-y-bordered.edit-peer-container.chat-members-container.active > div.sidebar-content > button > div";
  ("#folders-container > div > div.chatlist-top > ul > a.row.no-wrap.row-with-padding.row-clickable.hover-effect.rp.chatlist-chat.chatlist-chat-bigger.row-big.active > div.c-ripple");
  ("#folders-container > div > div.chatlist-top > ul > a:nth-child(4) > div.c-ripple");
  const contactList = await getList();
  const uniqueNumbersMap = new Map();
  contactList.forEach((contact) => {
    if (!uniqueNumbersMap.has(contact.number)) {
      uniqueNumbersMap.set(contact.number, contact.name);
    }
  });

  // Convert the Map back to an array of objects if needed
  const uniqueCombinations = Array.from(uniqueNumbersMap.entries()).map(
    ([number, name]) => ({ number, name })
  );
  console.log(uniqueCombinations);
  console.log(uniqueCombinations.length);
  // await page.waitForSelector(".chatlist-top");
  console.log("Chatulsu ari");
  // await page.waitForSelector(channelClass);
  // await page.click(channelClass);

  // console.log("gadavidaa");
  await page.waitForNavigation({ waitUntil: "domcontentloaded" });

  await page.waitForSelector(chatInfoClass);
  await page.click(chatInfoClass);

  await page.waitForSelector(editButtonClass);
  await page.click(editButtonClass);
  await page.waitForSelector(subscribersButtonClass);
  await page.click(subscribersButtonClass);

  await page.waitForSelector(addSubscribersButtonClass);
  await page.click(addSubscribersButtonClass);

  for (const lead in contactList) {
    await page.waitForSelector(searchInputClass);
    await page.type(searchInputClass, `${contactList[lead].number}`);
    console.log(contactList[lead].number);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const userClass = await page.$(chosenUserClass);
    const hasMultipleElements = await page.$eval(
      "#column-right > div > div.tabs-tab.sidebar-slider-item.scrolled-top.scrolled-bottom.scrollable-y-bordered.add-members-container.active > div.sidebar-content > div > div.chatlist-container > div > div.sidebar-left-section-container.selector-list-section-container > div > div > ul",
      (element) => element.childElementCount > 1
    );

    if (userClass && !hasMultipleElements) {
      await page.waitForSelector(chosenUserClass);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      await page.click(chosenUserClass);
      console.log("Daemata");
      await prisma.contact_list.update({
        where: {
          id: contactList[lead].id,
        },
        data: {
          added_in_group: true,
        },
      });
    } else {
      console.log("araferia");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await page.evaluate((searchInputClass) => {
        const searchInput = document.querySelector(searchInputClass);
        searchInput.value = "";
      }, searchInputClass);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.waitForSelector(addSelectedToChannelClass);
  await page.click(addSelectedToChannelClass);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  await page.waitForSelector(verifyAddUsersClass);
  await page.click(verifyAddUsersClass);
  console.log("Su Dameata");
})();


const getList = async () => {
  return await prisma.contact_list.findMany({
    where: {
      is_added: true,
      // csv_group: 2,
      country: "UK",
    },
    orderBy: {
      id: "asc",
    },
    skip: 40,
  });
};
