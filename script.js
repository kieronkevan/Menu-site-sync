async function loadMenu() {
  const res = await fetch("menu-data.json", { cache: "no-store" });
  const data = await res.json();
  renderInfo(data.info);
  renderNotice(data.info);
  renderMenu(data.items);
  setupChipScroll();
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

  // Group items by category, preserving first-seen order
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
    { rootMargin: "-140px 0px -70% 0px" }
  );
  sections.forEach((s) => observer.observe(s));
}

loadMenu();
