// Pulls menu data from Notion and writes it to site/menu-data.json.
// Run manually with: node scripts/sync-notion.js
// Run automatically by .github/workflows/rebuild.yml on a schedule.
//
// Needs three environment variables, set as GitHub repo secrets:
//   NOTION_TOKEN        - internal integration token
//   NOTION_MENU_DB_ID    - the "Menu items" database ID
//   NOTION_INFO_DB_ID    - the "Restaurant info" database ID (single row)

const fs = require("fs");
const path = require("path");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const MENU_DB_ID = process.env.NOTION_MENU_DB_ID;
const INFO_DB_ID = process.env.NOTION_INFO_DB_ID;

const NOTION_VERSION = "2022-06-28";

async function notionQuery(databaseId) {
  const res = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    }
  );
  if (!res.ok) {
    throw new Error(`Notion query failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.results;
}

function getText(prop) {
  if (!prop) return "";
  if (prop.type === "title") return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return prop.rich_text.map((t) => t.plain_text).join("");
  return "";
}

function getSelect(prop) {
  return prop && prop.select ? prop.select.name : "";
}

function getMultiSelect(prop) {
  return prop && prop.multi_select ? prop.multi_select.map((t) => t.name) : [];
}

function getNumber(prop) {
  return prop && typeof prop.number === "number" ? prop.number : 0;
}

function getCheckbox(prop) {
  return !!(prop && prop.checkbox);
}

function getUrl(prop) {
  return prop && prop.url ? prop.url : "";
}

function formatPrice(prop) {
  const n = getNumber(prop);
  return `\u00a3${n.toFixed(2)}`;
}

async function main() {
  if (!NOTION_TOKEN || !MENU_DB_ID || !INFO_DB_ID) {
    throw new Error(
      "Missing NOTION_TOKEN, NOTION_MENU_DB_ID or NOTION_INFO_DB_ID env vars"
    );
  }

  const menuPages = await notionQuery(MENU_DB_ID);
  const items = menuPages.map((page) => {
    const p = page.properties;
    return {
      name: getText(p.Name),
      category: getSelect(p.Category),
      price: formatPrice(p.Price),
      description: getText(p.Description),
      available: getCheckbox(p.Available),
      tags: getMultiSelect(p.Tags),
      sortOrder: getNumber(p["Sort order"]),
    };
  });

  const infoPages = await notionQuery(INFO_DB_ID);
  const infoPage = infoPages[0];
  const ip = infoPage ? infoPage.properties : {};
    const info = {
    name: getText(ip.Name) || "Menu",
    address: getText(ip.Address),
    hours: getText(ip["Opening hours"]),
    phone: getText(ip.Phone),
    notice: getText(ip.Notice),
    noticeActive: getCheckbox(ip["Notice active"]),
    tripadvisorRating: getNumber(ip["Tripadvisor rating"]),
    tripadvisorUrl: getUrl(ip["Tripadvisor url"]),
  };

  const output = { info, items };
  const outPath = path.join(__dirname, "..", "docs", "menu-data.json");
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${items.length} items to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

