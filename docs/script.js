let allItems = [];

async function loadMenu() {
  const res = await fetch("menu-data.json", { cache: "no-store" });
  const data = await res.json();
  allItems = data.items;
  renderInfo(data.info);
  renderNotice(data.info);
  renderMenu(data.items);
  setupChipScroll();
  setupSearch();
}

function renderInfo(info) {
  document.getElementById("shop-name").textContent = info.name;
  const details = `${info.address} \u00b7 ${info.hours}`;
  document.getElementById("shop-details").textContent = details;
  document.getElementById("footer-details").textContent = details;

    const telHref = "tel:" + info.phone.replace(/\s+/g, "");
  document.getElementById("phone-text").textContent = info.phone;
  document.getElementById("call-button").href = telHref;
  document.getElementById("footer-phone").href = telHref;
  document.getElementById("footer-phone").textContent = info.phone;

  const badge = document.getElementById("tripadvisor-badge");
  if (info.tripadvisorRating && info.tripadvisorUrl) {
    document.getElementById("tripadvisor-text").textContent = info.tripadvisorRating;
    badge.href = info.tripadvisorUrl;
    badge.hidden = false;
  }
}

function renderNotice(info) {
  const el = document.getElementById("notice");
  if (info.noticeActive && info.notice) {
    el.textContent = info.notice;
    el.hidden = false;
  } else {
    el.hidden = true;
  }
}

function renderMenu(items) {
  const menuEl = document.getElementById("menu");
  const chipsEl = document.getElementById("chips");
  menuEl.innerHTML = "";
  chipsEl.innerHTML = "";

  const categories = [];
  const grouped = {};
  items
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .forEach((item) => {
      if (item.available === false) return;
      if (!grouped[item.category]) {
        grouped[item.category] = [];
        categories.push(item.category);
      }
      grouped[item.category].push(item);
    });

  categories.forEach((category, i) => {
    const slug = slugify(category);

    const chip = document.createElement("button");
    chip.className = "chip" + (i === 0 ? " active" : "");
    chip.textContent = category;
    chip.dataset.target = slug;
    chipsEl.appendChild(chip);

    const section = document.createElement("section");
    section.className = "category-section";
    section.id = slug;

    const title = document.createElement("h2");
    title.className = "category-title";
    title.textContent = category;
    section.appendChild(title);

    grouped[category].forEach((item) => {
      section.appendChild(renderItemRow(item));
    });

    menuEl.appendChild(section);
  });
}

function renderItemRow(item) {
  const row = document.createElement("div");
  row.className = "item-row";

  const left = document.createElement("div");
  const name = document.createElement("p");
  name.className = "item-name";
  name.textContent = item.name;
  left.appendChild(name);

  if (item.description) {
    const desc = document.createElement("p");
    desc.className = "item-desc";
    desc.textContent = item.description;
    left.appendChild(desc);
  }

  if (item.tags && item.tags.length) {
    const tags = document.createElement("p");
    tags.className = "item-tags";
    tags.textContent = item.tags.join(" \u00b7 ");
    left.appendChild(tags);
  }

  const price = document.createElement("p");
  price.className = "item-price";
  price.textContent = item.price;

  row.appendChild(left);
  row.appendChild(price);
  return row;
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function setupChipScroll() {
  const chips = document.querySelectorAll(".chip");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const target = document.getElementById(chip.dataset.target);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  const sections = document.querySelectorAll(".category-section");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          chips.forEach((c) => c.classList.remove("active"));
          const activeChip = document.querySelector(
            `.chip[data-target="${entry.target.id}"]`
          );
          if (activeChip) activeChip.classList.add("active");
        }
      });
    },
    { rootMargin: "-70px 0px -70% 0px" }
  );
  sections.forEach((s) => observer.observe(s));
}

function setupSearch() {
  const trigger = document.getElementById("search-trigger");
  const overlay = document.getElementById("search-overlay");
  const input = document.getElementById("search-input");
  const closeBtn = document.getElementById("search-close");

    trigger.addEventListener("click", () => {
    overlay.classList.add("is-open");
    input.value = "";
    renderSearchResults("");
    input.focus();
  });

  closeBtn.addEventListener("click", () => {
    overlay.classList.remove("is-open");
    input.value = "";
  });

  input.addEventListener("input", () => {
    renderSearchResults(input.value.trim().toLowerCase());
  });
}

function renderSearchResults(query) {
  const results = document.getElementById("search-results");
  results.innerHTML = "";

  if (query.length === 0) {
    const prompt = document.createElement("p");
    prompt.className = "search-count";
    prompt.textContent = "Start typing to search the menu";
    results.appendChild(prompt);
    return;
  }

  const matches = allItems.filter(
    (item) => item.available !== false && item.name.toLowerCase().includes(query)
  );

  const count = document.createElement("p");
  count.className = "search-count";
  count.textContent = matches.length
    ? `${matches.length} dish${matches.length === 1 ? "" : "es"} match "${query}"`
    : `No dishes match "${query}"`;
  results.appendChild(count);

  matches.forEach((item) => {
    const row = renderItemRow(item);
    const category = document.createElement("p");
    category.className = "search-result-category";
    category.textContent = item.category;
    row.querySelector("div").appendChild(category);
    results.appendChild(row);
  });
}

loadMenu();
