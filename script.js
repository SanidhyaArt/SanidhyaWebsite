document.documentElement.classList.add("js");

document.querySelectorAll(".brand-name").forEach((brandName) => {
  brandName.textContent = "Sanidhya Singh";
});

const localeStorageKey = "locale";
const localeSuggestionDismissKey = "locale-suggestion-dismissed";
const pageLocale = document.documentElement.dataset.pageLocale || "en";
const prefersReducedMotion =
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
const analyticsEndpoint = "/api/track";
const backgroundMediaSources = {
  "brand-identity": "/assets/images/youtube-thumbnail.webp",
  "campaign-design": "/assets/images/campaign-design.jpg",
  illustration: "/assets/images/illustration.jpg",
  "game-art": "/assets/images/game-art.jpg",
  "motion-design": "/assets/images/motion-design.jpg",
  "three-d-visualization": "/assets/images/three-d-visualization.jpg",
  "architectural-visualization": "/assets/images/architectural-visualization.jpg",
  retouching: "/assets/images/retouching-wedding-after.webp",
};
const backgroundMediaVariants = {
  "brand-identity": {
    thumbnail: "/assets/images/youtube-thumbnail.webp",
    rollout: "/assets/images/brand-identity-rollout-01.webp",
  },
};

const getStoredLocale = () => {
  try {
    return window.localStorage.getItem(localeStorageKey);
  } catch (error) {
    return null;
  }
};

const setStoredLocale = (locale) => {
  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch (error) {
    return;
  }
};

const getSuggestionDismissed = () => {
  try {
    return window.sessionStorage.getItem(localeSuggestionDismissKey) === "true";
  } catch (error) {
    return false;
  }
};

const setSuggestionDismissed = () => {
  try {
    window.sessionStorage.setItem(localeSuggestionDismissKey, "true");
  } catch (error) {
    return;
  }
};

const activeLocale =
  pageLocale === "hi" || getStoredLocale() === "hi" ? "hi" : "en";

const normalizeLocalePath = (pathname = window.location.pathname) => {
  let normalizedPath = pathname || "/";

  normalizedPath = normalizedPath.replace(/\/index(?:\.html)?$/i, "/");
  normalizedPath = normalizedPath.replace(/\.html$/i, "");

  if (normalizedPath.startsWith("/hi")) {
    normalizedPath = normalizedPath.slice(3) || "/";
  }

  if (normalizedPath.length > 1) {
    normalizedPath = normalizedPath.replace(/\/+$/, "");
  }

  return normalizedPath || "/";
};

const currentLocalePath = normalizeLocalePath();

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildListMarkup = (items = []) =>
  items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

const buildRelatedMarkup = (items = [], prefix = "संबंधित") =>
  items
    .map(
      (item) => `
        <a class="related-link" href="${escapeHtml(item.href)}">
          <p>${escapeHtml(prefix)}</p>
          <h3>${escapeHtml(item.title)}</h3>
        </a>
      `
    )
    .join("");

const buildServicePageMarkup = (data) => `
  <section class="page-hero">
    <p class="eyebrow">${escapeHtml(data.heroEyebrow || "सेवा")}</p>
    <h1>${escapeHtml(data.title)}</h1>
  </section>

  <section class="split-section">
    <div class="page-grid">
      <article class="detail-card">
        <p class="service-index">${escapeHtml(data.includesLabel)}</p>
        ${
          data.includesTitle
            ? `<h3>${escapeHtml(data.includesTitle)}</h3>`
            : ""
        }
        <ul>${buildListMarkup(data.includesItems)}</ul>
      </article>
      <article class="detail-card">
        <p class="service-index">${escapeHtml(data.bestForLabel)}</p>
        <h3>${escapeHtml(data.bestForTitle)}</h3>
        <p>${escapeHtml(data.bestForText)}</p>
      </article>
    </div>
    <aside class="panel-card">
      <p class="service-index">${escapeHtml(data.outcomeLabel)}</p>
      <h3>${escapeHtml(data.outcomeTitle)}</h3>
      <p>${escapeHtml(data.outcomeText)}</p>
      <div class="section-actions">
        <a class="button button-secondary" href="${escapeHtml(data.ctaHref)}">${escapeHtml(
          data.ctaLabel
        )}</a>
      </div>
    </aside>
  </section>

  <section>
    <div class="offerings-grid">
      ${data.offerings
        .map(
          (group) => `
            <details class="offering-group">
              <summary><span class="service-index">${escapeHtml(
                group.title
              )}</span></summary>
              <ul>${buildListMarkup(group.items)}</ul>
            </details>
          `
        )
        .join("")}
    </div>
  </section>

  <section class="related-services">
    <div class="section-heading narrow">
      <p class="eyebrow">${escapeHtml(data.relatedEyebrow || "संबंधित सेवाएँ")}</p>
      <h2>${escapeHtml(data.relatedHeading || "पास की सेवाएँ देखें।")}</h2>
    </div>
    <div class="related-grid">${buildRelatedMarkup(data.relatedItems)}</div>
  </section>
`;

const buildWorkPageMarkup = (data) => `
  <section class="page-hero">
    <p class="eyebrow">${escapeHtml(data.heroEyebrow || "काम")}</p>
    <h1>${escapeHtml(data.title)}</h1>
    <p>${escapeHtml(data.description)}</p>
  </section>

  <section class="split-section">
    <div class="page-grid">
      <article class="detail-card">
        <p class="service-index">${escapeHtml(data.focusLabel || "फोकस")}</p>
        <ul>${buildListMarkup(data.focusItems)}</ul>
      </article>
      <article class="detail-card">
        <p class="service-index">${escapeHtml(data.bestForLabel || "कब उपयोगी")}</p>
        <h3>${escapeHtml(data.bestForTitle)}</h3>
        <p>${escapeHtml(data.bestForText)}</p>
      </article>
    </div>
    <aside class="panel-card">
      <p class="service-index">${escapeHtml(data.linkedLabel || "जुड़ी हुई सेवा")}</p>
      <h3>${escapeHtml(data.linkedTitle)}</h3>
      <p>${escapeHtml(data.linkedText)}</p>
      <div class="work-case-actions">
        <a class="button button-secondary" href="${escapeHtml(data.viewHref)}">${escapeHtml(
          data.viewLabel || "सेवा देखें"
        )}</a>
        <a class="button button-secondary" href="${escapeHtml(data.inquireHref)}">${escapeHtml(
          data.inquireLabel || "पूछताछ करें"
        )}</a>
      </div>
    </aside>
  </section>

  <section class="work-case-grid">
    ${data.cases
      .map(
        (item) => `
          <article class="work-case-card${item.wide ? " is-wide" : ""}" data-preview="${escapeHtml(
            item.preview
          )}">
            <div class="work-case-media"${item.style ? ` style="${escapeHtml(item.style)}"` : ""}></div>
            <div class="work-case-copy">
              <p class="service-index">${escapeHtml(item.index)}</p>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.body)}</p>
            </div>
          </article>
        `
      )
      .join("")}
  </section>

  <section class="related-services">
    <div class="section-heading narrow">
      <p class="eyebrow">${escapeHtml(data.relatedEyebrow || "और काम")}</p>
      <h2>${escapeHtml(data.relatedHeading || "करीबी काम के प्रकार देखें।")}</h2>
    </div>
    <div class="related-grid">${buildRelatedMarkup(data.relatedItems)}</div>
  </section>
`;

const hindiServicePages = {
  "/brand-identity": {
    metaTitle: "ब्रांड आइडेंटिटी | Sanidhya Singh",
    metaDescription:
      "प्रीमियम ब्रांड्स, लॉन्च और लंबी अवधि की पोज़िशनिंग के लिए ब्रांड आइडेंटिटी और विज़ुअल सिस्टम्स।",
    title: "ब्रांड आइडेंटिटी और विज़ुअल सिस्टम्स",
    includesLabel: "शामिल है",
    includesTitle: "मुख्य पहचान डिज़ाइन",
    includesItems: [
      "लोगो सिस्टम और ब्रांड मार्क्स",
      "टाइपोग्राफी और रंग दिशा",
      "विज़ुअल लैंग्वेज और एप्लिकेशन नियम",
      "ब्रांड गाइडलाइन्स और सपोर्टिंग एसेट्स",
    ],
    bestForLabel: "उपयुक्त",
    bestForTitle: "उन ब्रांड्स के लिए जिन्हें अधिक परिष्कृत उपस्थिति चाहिए",
    bestForText:
      "फाउंडर्स, प्रोडक्ट कंपनियों, एजेंसियों और प्रीमियम-फेसिंग व्यवसायों के लिए उपयोगी जो लॉन्च या रिफ्रेश की तैयारी में हैं।",
    outcomeLabel: "परिणाम",
    outcomeTitle: "ऐसा ब्रांड सिस्टम जो हर जगह सोच-समझकर बना हुआ लगे।",
    outcomeText:
      "वेब, सोशल, पैकेजिंग, कैंपेन और क्लाइंट-फेसिंग मटेरियल तक आसानी से स्केल करने के लिए तैयार।",
    ctaHref: "/hi/contact?service=brand-identity",
    ctaLabel: "ब्रांडिंग के लिए पूछताछ करें",
    offerings: [
      {
        title: "लोगो",
        items: [
          "प्राइमरी लोगो डिज़ाइन",
          "लोगो वैरिएंट्स",
          "लोगो मॉडर्नाइज़ेशन / री-ड्रॉ",
          "रिस्पॉन्सिव लोगो सिस्टम्स",
          "फेविकॉन और ऐप आइकन एडैप्टेशन",
        ],
      },
      {
        title: "आइकनोग्राफी",
        items: [
          "कस्टम आइकन सेट्स",
          "UI, प्रोडक्ट और नेविगेशन आइकन्स",
          "मार्केटिंग आइकन पैक्स",
          "SVG आइकन लाइब्रेरियाँ",
          "एनिमेटेड और Lottie आइकन्स",
        ],
      },
      {
        title: "विज़ुअल लैंग्वेज",
        items: ["कलर पैलेट डिज़ाइन", "टाइपोग्राफी चयन"],
      },
      {
        title: "ब्रांड एसेट्स",
        items: [
          "सोशल मीडिया टेम्पलेट्स",
          "इवेंट बैनर्स",
          "बिज़नेस कार्ड्स",
          "लेटरहेड्स",
          "ईमेल सिग्नेचर्स",
          "वेबसाइट और लैंडिंग पेज विज़ुअल्स",
          "ऐप स्प्लैश स्क्रीन",
        ],
      },
      {
        title: "इलस्ट्रेशन सिस्टम्स",
        items: [
          "कैरेक्टर मैस्कॉट्स",
          "वेबसाइट इलस्ट्रेशन्स",
          "ऐप ऑनबोर्डिंग इलस्ट्रेशन्स",
        ],
      },
      {
        title: "मोशन ब्रांडिंग",
        items: ["एनिमेटेड लोगो और रिवील्स", "ब्रांड इंट्रो वीडियोज़"],
      },
      {
        title: "ब्रांड स्ट्रैटेजी",
        items: [
          "ब्रांड पोज़िशनिंग",
          "ब्रांड पर्सनैलिटी डिफिनिशन",
          "ब्रांड वॉइस डायरेक्शन",
        ],
      },
      {
        title: "रीब्रांडिंग",
        items: ["ब्रांड आइडेंटिटी रिफ्रेश", "विज़ुअल आइडेंटिटी सिंप्लिफिकेशन"],
      },
    ],
    relatedItems: [
      { href: "./campaign-design", title: "कैंपेन डिज़ाइन" },
      { href: "./illustration", title: "इलस्ट्रेशन" },
      { href: "./motion-design", title: "मोशन डिज़ाइन" },
      { href: "./retouching", title: "रिटचिंग" },
    ],
  },
  "/campaign-design": {
    metaTitle: "कैंपेन डिज़ाइन | Sanidhya Singh",
    metaDescription:
      "लॉन्च, प्रमोशन और हाई-इम्पैक्ट डिजिटल कम्युनिकेशन के लिए कैंपेन डिज़ाइन और मार्केटिंग विज़ुअल्स।",
    title: "कैंपेन डिज़ाइन और मार्केटिंग विज़ुअल्स",
    includesLabel: "शामिल है",
    includesItems: [
      "लॉन्च ग्राफिक्स और कैंपेन की विज़ुअल्स",
      "सोशल मीडिया क्रिएटिव और ऐड एसेट्स",
      "पोस्टर सिस्टम्स और इवेंट विज़ुअल्स",
      "डिजिटल रोलआउट्स के लिए मार्केटिंग ग्राफिक्स",
    ],
    bestForLabel: "उपयुक्त",
    bestForTitle: "उन ब्रांड्स के लिए जिन्हें अधिक धारदार मार्केट-फेसिंग कम्युनिकेशन चाहिए",
    bestForText:
      "ऐसे कैंपेन के लिए उपयुक्त जिन्हें चैनलों के पार तेज़, पॉलिश्ड और रणनीतिक रूप से सुसंगत महसूस होना चाहिए।",
    outcomeLabel: "परिणाम",
    outcomeTitle: "ऐसा क्रिएटिव जो लॉन्च को अधिक आत्मविश्वास के साथ आगे ले जाए।",
    outcomeText:
      "तेज़ मोमेंटम, साफ़ दृश्य दिशा और बेहतर बाज़ार उपस्थिति देने के लिए तैयार।",
    ctaHref: "/hi/contact?service=campaign-design",
    ctaLabel: "कैंपेन पर बात करें",
    offerings: [
      {
        title: "मार्केटिंग और सोशल",
        items: [
          "YouTube थंबनेल्स",
          "पॉडकास्ट कवर आर्ट",
          "Instagram कैरोसेल ग्राफिक्स",
          "Instagram ऐड क्रिएटिव्स",
          "Facebook ऐड ग्राफिक्स",
          "LinkedIn मार्केटिंग बैनर्स",
          "TikTok कवर थंबनेल्स",
        ],
      },
      {
        title: "स्पोर्ट्स ग्राफिक्स",
        items: [
          "गेमडे ग्राफिक्स",
          "प्लेयर अनाउंसमेंट ग्राफिक्स",
          "मैच रिज़ल्ट पोस्टर्स",
          "टीम लाइनअप ग्राफिक्स",
          "हाइलाइट ग्राफिक्स",
        ],
      },
      {
        title: "ब्रांड मार्केटिंग",
        items: [
          "प्रमोशनल पोस्टर्स",
          "प्रोडक्ट लॉन्च ग्राफिक्स",
          "इवेंट पोस्टर्स",
          "फेस्टिवल कैंपेन ग्राफिक्स",
        ],
      },
      {
        title: "एंटरटेनमेंट और मीडिया",
        items: [
          "मूवी पोस्टर्स",
          "सीरीज़ पोस्टर्स",
          "सिनेमैटिक टाइटल कार्ड्स",
          "फिल्म फेस्टिवल पोस्टर्स",
        ],
      },
      {
        title: "क्रिएटर कैंपेन एसेट्स",
        items: [
          "चैनल ब्रांडिंग पैकेजेस",
          "थंबनेल डिज़ाइन सिस्टम्स",
          "स्ट्रीम ओवरलेज़",
          "Twitch बैनर्स",
        ],
      },
    ],
    relatedItems: [
      { href: "./brand-identity", title: "ब्रांड आइडेंटिटी" },
      { href: "./motion-design", title: "मोशन डिज़ाइन" },
      { href: "./illustration", title: "इलस्ट्रेशन" },
      { href: "./retouching", title: "रिटचिंग" },
    ],
  },
  "/illustration": {
    metaTitle: "इलस्ट्रेशन | Sanidhya Singh",
    metaDescription:
      "ब्रांड्स, एडिटोरियल काम, स्टोरीटेलिंग और प्रेज़ेंटेशन के लिए कस्टम इलस्ट्रेशन और विज़ुअल डेवलपमेंट।",
    title: "इलस्ट्रेशन और विज़ुअल डेवलपमेंट",
    includesLabel: "शामिल है",
    includesItems: [
      "एडिटोरियल और ब्रांडेड इलस्ट्रेशन",
      "कॉन्सेप्ट स्केचेज़ और विज़ुअल डेवलपमेंट",
      "कैरेक्टर, एनवायरनमेंट और स्टोरीटेलिंग आर्ट",
      "प्रेज़ेंटेशन-रेडी कस्टम आर्टवर्क",
    ],
    bestForLabel: "उपयुक्त",
    bestForTitle: "उन प्रोजेक्ट्स के लिए जिन्हें एक अलग विज़ुअल आवाज़ चाहिए",
    bestForText:
      "जब फ़ोटोग्राफ़ी या स्टॉक विज़ुअल्स किसी प्रोजेक्ट की टोन या मौलिकता नहीं उठा पाते, तब यह सबसे उपयोगी है।",
    outcomeLabel: "परिणाम",
    outcomeTitle: "ऐसा इलस्ट्रेशन जो माहौल, व्यक्तित्व और मौलिकता जोड़ता है।",
    outcomeText:
      "ब्रांड, संपादकीय या कहानी-आधारित संदर्भों में अधिक authored और यादगार दृश्य उपस्थिति के लिए।",
    ctaHref: "/hi/contact?service=illustration",
    ctaLabel: "इलस्ट्रेशन के लिए पूछताछ करें",
    offerings: [
      {
        title: "एडिटोरियल और पब्लिशिंग",
        items: [
          "एडिटोरियल इलस्ट्रेशन्स",
          "बुक कवर इलस्ट्रेशन्स",
          "चिल्ड्रन्स बुक इलस्ट्रेशन्स",
          "एजुकेशनल इलस्ट्रेशन",
        ],
      },
      {
        title: "कैरेक्टर और नैरेटिव",
        items: [
          "कैरेक्टर इलस्ट्रेशन्स",
          "कॉमिक और मंगा आर्ट",
          "मैस्कॉट इलस्ट्रेशन्स",
          "स्टिकर पैक इलस्ट्रेशन्स",
        ],
      },
      {
        title: "कॉन्सेप्ट और डेवलपमेंट",
        items: [
          "कैरेक्टर कॉन्सेप्ट आर्ट",
          "एनवायरनमेंट कॉन्सेप्ट आर्ट",
          "प्रॉप डिज़ाइन",
          "क्रीचर डिज़ाइन",
          "स्टोरीबोर्डिंग",
          "विज़ुअल डेवलपमेंट",
        ],
      },
      {
        title: "स्पेशलाइज़्ड इलस्ट्रेशन",
        items: [
          "मेडिकल और साइंटिफिक इलस्ट्रेशन",
          "टेक्निकल इलस्ट्रेशन",
          "मैप इलस्ट्रेशन",
          "फैशन इलस्ट्रेशन",
          "आर्किटेक्चरल इलस्ट्रेशन",
        ],
      },
      {
        title: "कमर्शियल और इन्फोग्राफिक",
        items: [
          "एडवरटाइजिंग इलस्ट्रेशन",
          "प्रोडक्ट इलस्ट्रेशन",
          "इन्फोग्राफिक डिज़ाइन",
          "वेबसाइट और लैंडिंग पेज इलस्ट्रेशन्स",
          "ऑनबोर्डिंग इलस्ट्रेशन्स",
        ],
      },
    ],
    relatedItems: [
      { href: "./brand-identity", title: "ब्रांड आइडेंटिटी" },
      { href: "./game-art", title: "गेम आर्ट" },
      { href: "./campaign-design", title: "कैंपेन डिज़ाइन" },
      { href: "./motion-design", title: "मोशन डिज़ाइन" },
    ],
  },
  "/game-art": {
    metaTitle: "गेम आर्ट | Sanidhya Singh",
    metaDescription:
      "इमर्सिव, प्रोडक्शन-अवेयर इंटरैक्टिव एक्सपीरियंस के लिए गेम आर्ट, UI और सपोर्टिंग विज़ुअल्स।",
    title: "गेम आर्ट और इंटरैक्टिव विज़ुअल डिज़ाइन",
    includesLabel: "शामिल है",
    includesItems: [
      "गेम UI और HUD सिस्टम्स",
      "आइकन्स, एसेट्स और एनवायरनमेंट विज़ुअल्स",
      "बैकग्राउंड्स और कॉन्सेप्ट-ड्रिवन सपोर्ट आर्ट",
      "प्रोडक्शन-अलाइन 2D एसेट क्रिएशन",
    ],
    bestForLabel: "उपयुक्त",
    bestForTitle: "उन स्टूडियोज़ और टीमों के लिए जो गेमप्ले में विज़ुअल स्पष्टता चाहते हैं",
    bestForText:
      "उन प्रोजेक्ट्स के लिए उपयोगी जिन्हें इमर्शन, पठनीयता और प्रोडक्शन-रेडी सपोर्ट के बीच संतुलन चाहिए।",
    outcomeLabel: "परिणाम",
    outcomeTitle: "ऐसे इंटरैक्टिव विज़ुअल्स जो पॉलिश्ड और प्रोडक्शन-अवेयर लगें।",
    outcomeText:
      "गेमप्ले को साफ़ रखने, वर्ल्डबिल्डिंग को मजबूत करने और स्क्रीन-लेवल हाइरार्की सुधारने के लिए तैयार।",
    ctaHref: "/hi/contact?service=game-art",
    ctaLabel: "गेम आर्ट पर बात करें",
    offerings: [
      {
        title: "2D एसेट्स",
        items: [
          "स्प्राइट आर्ट",
          "बैकग्राउंड आर्ट",
          "आइटम, वेपन और स्किल आइकन्स",
          "कार्ड गेम इलस्ट्रेशन्स",
        ],
      },
      {
        title: "कॉन्सेप्ट आर्ट",
        items: [
          "कैरेक्टर कॉन्सेप्ट आर्ट",
          "एनवायरनमेंट कॉन्सेप्ट आर्ट",
          "क्रीचर डिज़ाइन",
          "प्रॉप डिज़ाइन",
        ],
      },
      {
        title: "UI और HUD",
        items: ["गेम UI डिज़ाइन", "गेम HUD डिज़ाइन"],
      },
      {
        title: "3D गेम सपोर्ट",
        items: [
          "एनवायरनमेंट आर्ट",
          "कैरेक्टर आर्ट",
          "लेवल आर्ट",
          "वेपन आर्ट",
          "व्हीकल आर्ट",
          "गेम FX",
          "टेक्निकल आर्ट",
        ],
      },
      {
        title: "गेम एसेट्स",
        items: [
          "लो-पॉली गेम एसेट्स",
          "एनवायरनमेंट एसेट्स",
          "मॉड्यूलर एनवायरनमेंट किट्स",
          "वेपन मॉडल्स",
          "व्हीकल मॉडल्स",
          "प्रॉप एसेट्स",
          "PBR मैटेरियल क्रिएशन",
        ],
      },
    ],
    relatedItems: [
      { href: "./illustration", title: "इलस्ट्रेशन" },
      { href: "./motion-design", title: "मोशन डिज़ाइन" },
      { href: "./three-d-visualization", title: "3D विज़ुअलाइज़ेशन" },
      { href: "./architectural-visualization", title: "आर्किटेक्चरल विज़ुअलाइज़ेशन" },
    ],
  },
  "/motion-design": {
    metaTitle: "मोशन डिज़ाइन | Sanidhya Singh",
    metaDescription:
      "लॉन्च, ब्रांड्स और डिजिटल प्रेज़ेंटेशन के लिए मोशन डिज़ाइन और ऐनिमेटेड कंटेंट।",
    title: "मोशन डिज़ाइन और ऐनिमेटेड कंटेंट",
    includesLabel: "शामिल है",
    includesItems: [
      "लोगो ऐनिमेशन और ब्रांडेड मोशन",
      "टाइटल सीक्वेन्स और सोशल ऐनिमेशन",
      "एक्सप्लेनर और लॉन्च सपोर्ट ऐनिमेशन",
      "डिजिटल प्रेज़ेंटेशन के लिए मोशन सिस्टम्स",
    ],
    bestForLabel: "उपयुक्त",
    bestForTitle: "उन प्रोजेक्ट्स के लिए जिन्हें अधिक ऊर्जा और यादगारपन चाहिए",
    bestForText:
      "जब किसी आइडिया को ज़्यादा साफ़, ज़्यादा गतिशील और अधिक ब्रांड-अनुकूल तरीके से पेश करना हो, तब यह सबसे उपयोगी है।",
    outcomeLabel: "परिणाम",
    outcomeTitle: "ऐसे ऐनिमेटेड विज़ुअल्स जो generic नहीं बल्कि polished लगें।",
    outcomeText:
      "ब्रांड इम्प्रेशन, narrative clarity और launch momentum को साथ लेकर चलने वाला मोशन।",
    ctaHref: "/hi/contact?service=motion-design",
    ctaLabel: "मोशन पर बात करें",
    offerings: [
      {
        title: "2D ऐनिमेशन",
        items: [
          "कैरेक्टर ऐनिमेशन (2D)",
          "कटसीन ऐनिमेशन",
          "स्प्राइट ऐनिमेशन",
          "कीफ़्रेम ऐनिमेशन",
          "इन-बिटवीन ऐनिमेशन",
          "2D इफेक्ट्स ऐनिमेशन",
        ],
      },
      {
        title: "मोशन ग्राफिक्स",
        items: ["मोशन ग्राफिक्स डिज़ाइन", "ब्रॉडकास्ट ग्राफिक्स", "टाइटल डिज़ाइन"],
      },
      {
        title: "एक्सप्लेनर और सोशल",
        items: [
          "एक्सप्लेनर वीडियोज़",
          "एनिमेटेड सोशल पोस्ट्स",
          "एनिमेटेड लोगो",
          "YouTube इंट्रो ऐनिमेशन्स",
          "ऐप्स के लिए Lottie ऐनिमेशन्स",
        ],
      },
      {
        title: "3D मोशन",
        items: [
          "3D मोशन डिज़ाइन",
          "प्रोडक्ट ऐनिमेशन",
          "3D लोगो ऐनिमेशन",
          "कैमरा ऐनिमेशन्स",
        ],
      },
      {
        title: "सिमुलेशन और FX",
        items: [
          "क्लॉथ सिमुलेशन",
          "रिजिड बॉडी डेस्ट्रक्शन",
          "फ्लुइड सिमुलेशन्स",
          "स्मोक / फायर इफेक्ट्स",
          "पार्टिकल सिमुलेशन्स",
        ],
      },
    ],
    relatedItems: [
      { href: "./campaign-design", title: "कैंपेन डिज़ाइन" },
      { href: "./illustration", title: "इलस्ट्रेशन" },
      { href: "./game-art", title: "गेम आर्ट" },
      { href: "./three-d-visualization", title: "3D विज़ुअलाइज़ेशन" },
    ],
  },
  "/three-d-visualization": {
    metaTitle: "3D विज़ुअलाइज़ेशन | Sanidhya Singh",
    metaDescription:
      "प्रोडक्ट्स, लॉन्च और प्रीमियम कमर्शियल प्रेज़ेंटेशन के लिए 3D डिज़ाइन और विज़ुअलाइज़ेशन।",
    title: "3D डिज़ाइन और प्रोडक्ट विज़ुअलाइज़ेशन",
    includesLabel: "शामिल है",
    includesItems: [
      "प्रोडक्ट रेंडर्स और हीरो विज़ुअल्स",
      "3D मॉडलिंग, सरफेसिंग और लाइटिंग",
      "टर्नटेबल्स और कमर्शियल प्रोडक्ट इमेजरी",
      "लॉन्च के लिए लक्ज़री-फोकस्ड विज़ुअलाइज़ेशन",
    ],
    bestForLabel: "उपयुक्त",
    bestForTitle: "उन प्रोडक्ट्स के लिए जिन्हें खरीद से पहले अधिक प्रीमियम महसूस होना चाहिए",
    bestForText:
      "जब किसी ऑब्जेक्ट को standard catalog photography से अधिक polished, desirable और clear दिखाना हो तब यह सबसे ज़्यादा उपयोगी है।",
    outcomeLabel: "परिणाम",
    outcomeTitle: "ऐसे 3D विज़ुअल्स जो clarity, desirability और presentation quality बढ़ाएँ।",
    outcomeText:
      "कैंपेन, listings, decks और launch assets के लिए प्रोडक्ट्स को अधिक commercial strength देने वाला काम।",
    ctaHref: "/hi/contact?service=three-d-visualization",
    ctaLabel: "3D विज़ुअलाइज़ेशन पर बात करें",
    offerings: [
      {
        title: "3D डायरेक्शन",
        items: ["जनरल 3D सपोर्ट", "3D कॉन्सेप्ट आर्ट", "3D विज़ुअल डेवलपमेंट"],
      },
      {
        title: "मॉडलिंग",
        items: [
          "एनवायरनमेंट मॉडलिंग",
          "हार्ड सरफेस मॉडलिंग",
          "व्हीकल मॉडलिंग",
          "कैरेक्टर मॉडलिंग",
          "कैरेक्टर स्कल्प्टिंग",
          "प्रॉप मॉडलिंग",
        ],
      },
      {
        title: "सरफेसिंग और लाइटिंग",
        items: [
          "टेक्सचर आर्ट",
          "मैटेरियल डिज़ाइन",
          "लुक डेवलपमेंट",
          "लाइटिंग",
          "रेंडरिंग",
          "सीन असेंबली",
        ],
      },
      {
        title: "प्रोडक्ट विज़ुअल्स",
        items: [
          "प्रोडक्ट हीरो रेंडर्स",
          "Amazon लिस्टिंग रेंडर्स",
          "ई-कॉमर्स प्रोडक्ट इमेजेस",
          "360° प्रोडक्ट टर्नटेबल्स",
          "प्रोडक्ट कटअवे रेंडर्स",
          "प्रोडक्ट लाइफ़स्टाइल रेंडर्स",
          "प्रोडक्ट एक्सप्लोडेड व्यूज़",
        ],
      },
      {
        title: "लक्ज़री प्रोडक्ट्स",
        items: [
          "वॉच रेंडर्स",
          "ज्वेलरी रेंडर्स",
          "कॉस्मेटिक प्रोडक्ट रेंडर्स",
          "परफ्यूम बॉटल रेंडर्स",
          "पैकेजिंग विज़ुअलाइज़ेशन",
          "वर्चुअल प्रोडक्ट फ़ोटोग्राफी",
        ],
      },
    ],
    relatedItems: [
      { href: "./architectural-visualization", title: "आर्किटेक्चरल विज़ुअलाइज़ेशन" },
      { href: "./motion-design", title: "मोशन डिज़ाइन" },
      { href: "./retouching", title: "रिटचिंग" },
      { href: "./game-art", title: "गेम आर्ट" },
    ],
  },
  "/architectural-visualization": {
    metaTitle: "आर्किटेक्चरल विज़ुअलाइज़ेशन | Sanidhya Singh",
    metaDescription:
      "स्पेसेज़, इंस्टॉलेशन्स और रियल एस्टेट प्रेज़ेंटेशन के लिए आर्किटेक्चरल और स्पैशियल विज़ुअल्स।",
    title: "आर्किटेक्चरल और स्पैशियल विज़ुअलाइज़ेशन",
    includesLabel: "शामिल है",
    includesItems: [
      "इंटीरियर और एक्सटीरियर रेंडरिंग",
      "रियल एस्टेट विज़ुअल्स और स्टेजिंग सपोर्ट",
      "एक्सपेरिएंशियल और एनवायरनमेंटल मॉकअप्स",
      "स्पेसेज़ और इंस्टॉलेशन्स के लिए प्रेज़ेंटेशन इमेजरी",
    ],
    bestForLabel: "उपयुक्त",
    bestForTitle: "आर्किटेक्ट्स, डेवलपर्स, स्टूडियोज़ और स्पैशियल ब्रांड्स के लिए",
    bestForText:
      "जब स्पेस को approve, sell या present करने से पहले लोगों को अंतिम परिणाम पर भरोसा दिलाना ज़रूरी हो।",
    outcomeLabel: "परिणाम",
    outcomeTitle: "ऐसे स्पैशियल विज़ुअल्स जो प्रस्तावित परिणाम पर भरोसा और buy-in आसान बनाते हैं।",
    outcomeText:
      "प्रोजेक्ट विज़न को जल्दी समझाने, approvals तेज़ करने और मार्केटिंग प्रस्तुति बेहतर बनाने के लिए।",
    ctaHref: "/hi/contact?service=architectural-visualization",
    ctaLabel: "स्पेस पर बात करें",
    offerings: [
      {
        title: "मॉडलिंग और रेंडर्स",
        items: [
          "आर्किटेक्चरल मॉडलिंग",
          "इंटीरियर रेंडर्स",
          "एक्सटीरियर आर्किटेक्चरल रेंडर्स",
        ],
      },
      {
        title: "रियल एस्टेट और स्टेजिंग",
        items: [
          "रियल एस्टेट मार्केटिंग इमेजेस",
          "फर्नीचर स्टेजिंग रेंडर्स",
          "मैटेरियल बदलाव (फ्लोर / वॉल्स)",
          "डे / नाइट लाइटिंग वैरिएशन्स",
          "लाइटिंग विज़ुअलाइज़ेशन",
        ],
      },
      {
        title: "एनवायरनमेंट और प्रेज़ेंटेशन",
        items: [
          "आर्किटेक्चरल वॉकथ्रू ऐनिमेशन्स",
          "फ्लाइथ्रू ऐनिमेशन्स",
          "स्टाइलाइज़्ड एनवायरनमेंट सीन्स",
          "रियलिस्टिक एनवायरनमेंट्स",
          "लैंडस्केप सीन्स",
          "डायोरामा सीन्स",
        ],
      },
      {
        title: "स्पैशियल ब्रांडिंग",
        items: [
          "ऑफिस वॉल ग्राफिक्स",
          "स्टोर साइनेज डिज़ाइन",
          "एग्ज़िबिशन बूथ ब्रांडिंग",
          "वेफाइंडिंग साइनेज सिस्टम्स",
          "रिसेप्शन लोगो वॉल्स",
        ],
      },
      {
        title: "विज़ुअल मॉकअप्स",
        items: [
          "एग्ज़िबिशन बूथ विज़ुअलाइज़ेशन",
          "रिटेल स्टोर विज़ुअलाइज़ेशन",
          "फैन बूथ कॉन्सेप्ट रेंडर्स",
          "ब्रांड इंस्टॉलेशन मॉकअप्स",
        ],
      },
    ],
    relatedItems: [
      { href: "./three-d-visualization", title: "3D विज़ुअलाइज़ेशन" },
      { href: "./retouching", title: "रिटचिंग" },
      { href: "./campaign-design", title: "कैंपेन डिज़ाइन" },
      { href: "./brand-identity", title: "ब्रांड आइडेंटिटी" },
    ],
  },
  "/retouching": {
    metaTitle: "रिटचिंग | Sanidhya Singh",
    metaDescription:
      "पोर्ट्रेट, प्रोडक्ट और प्रीमियम कमर्शियल इमेजरी के लिए रिटचिंग और इमेज रिफाइनमेंट।",
    title: "रिटचिंग और इमेज रिफाइनमेंट",
    includesLabel: "शामिल है",
    includesItems: [
      "पोर्ट्रेट और प्रोडक्ट रिटचिंग",
      "इंटीरियर इमेज क्लीनअप और करेक्शन",
      "कैंपेन इमेजरी के लिए कलर ग्रेडिंग और पॉलिश",
      "हाई-एंड विज़ुअल्स के लिए प्रेज़ेंटेशन रिफाइनमेंट",
    ],
    bestForLabel: "उपयुक्त",
    bestForTitle: "उन इमेजेज़ के लिए जो काम तो करती हैं, पर उन्हें और महँगा दिखना चाहिए",
    bestForText:
      "जब composition सही हो, लेकिन detail cleanup, balance और finish अभी भी परिणाम को सीमित कर रहे हों।",
    outcomeLabel: "परिणाम",
    outcomeTitle: "ऐसी refined imagery जो ज़्यादा साफ़, sharp और intentional लगे।",
    outcomeText:
      "कैंपेन, listings और client-facing presentation में final frame को ज़्यादा premium feel देने के लिए।",
    ctaHref: "/hi/contact?service=retouching",
    ctaLabel: "रिटचिंग के लिए पूछताछ करें",
    offerings: [
      {
        title: "पोर्ट्रेट और वेडिंग",
        items: [
          "वेडिंग फोटो रिटचिंग",
          "स्किन रिटचिंग",
          "दाँत और आँख enhancement",
          "वेडिंग एल्बम कलर ग्रेडिंग",
          "फ़ोटो से अनचाहे लोगों को हटाना",
        ],
      },
      {
        title: "प्रोडक्ट",
        items: [
          "ज्वेलरी रिटचिंग",
          "वॉच रिटचिंग",
          "मेटल प्रोडक्ट्स के लिए reflection cleanup",
          "डस्ट / स्क्रैच removal",
          "प्रोडक्ट shadow creation",
          "प्रोडक्ट background removal",
        ],
      },
      {
        title: "फैशन और कॉमर्स",
        items: ["कपड़ों की wrinkles removal", "background replacement", "catalog image preparation"],
      },
    ],
    relatedItems: [
      { href: "./campaign-design", title: "कैंपेन डिज़ाइन" },
      { href: "./three-d-visualization", title: "3D विज़ुअलाइज़ेशन" },
      { href: "./architectural-visualization", title: "आर्किटेक्चरल विज़ुअलाइज़ेशन" },
      { href: "./brand-identity", title: "ब्रांड आइडेंटिटी" },
    ],
  },
};

const hindiWorkPages = {
  "/product-renders": {
    metaTitle: "प्रोडक्ट रेंडर्स | Sanidhya Singh",
    metaDescription:
      "लक्ज़री इमेजरी, लॉन्च विज़ुअल्स और प्रीमियम ई-कॉमर्स प्रेज़ेंटेशन में प्रोडक्ट रेंडर काम का एक केंद्रित चयन।",
    title: "प्रोडक्ट रेंडर्स",
    description:
      "ऐसी प्रीमियम प्रोडक्ट इमेजरी जो ऑब्जेक्ट हाथ में आने से पहले ही उसकी perceived value बढ़ा दे।",
    focusItems: [
      "लक्ज़री हीरो इमेजरी",
      "मल्टी-एंगल मार्केटप्लेस विज़ुअल्स",
      "मैटेरियल और फिनिश क्लोज़-अप्स",
      "लॉन्च डेक्स और सेल्स प्रेज़ेंटेशन फ्रेम्स",
    ],
    bestForTitle: "प्रीमियम लॉन्च, ई-कॉमर्स रोलआउट्स और इन्वेस्टर-फेसिंग डेक्स के लिए।",
    bestForText:
      "जब किसी ऑब्जेक्ट को standard catalog photography से ज़्यादा desirable, premium और finished महसूस कराना हो।",
    linkedTitle: "3D डिज़ाइन और प्रोडक्ट विज़ुअलाइज़ेशन",
    linkedText:
      "उन प्रोडक्ट्स के लिए जो commercial clarity, elevated perception और polished launch imagery चाहते हैं।",
    viewHref: "./three-d-visualization",
    inquireHref: "/hi/contact?service=three-d-visualization",
    cases: [
      {
        index: "01",
        title: "लक्ज़री हीरो फ्रेम",
        body: "लॉन्च पेज, pitch deck और campaign header में first-impression value बढ़ाने के लिए तैयार किया गया front-facing hero render।",
        wide: true,
        preview: "three-d-visualization",
        style: "background-position:center 28%;",
      },
      {
        index: "02",
        title: "डिटेल मैटेरियल स्टडी",
        body: "ऐसी close-up framing जो finishes, reflections और craftsmanship को tactile और premium महसूस कराए।",
        preview: "three-d-visualization",
        style: "background-position:center 52%;",
      },
      {
        index: "03",
        title: "मार्केटप्लेस रेंडर सेट",
        body: "ई-कॉमर्स listings, packaging previews और rollout consistency के लिए बनाया गया clean multi-view product system।",
        preview: "three-d-visualization",
        style: "background-position:center 70%;",
      },
    ],
    relatedItems: [
      { href: "./explainer-videos", title: "2D एक्सप्लेनर वीडियोज़" },
      { href: "./campaign-visuals", title: "कैंपेन विज़ुअल्स" },
      { href: "./high-end-retouching", title: "हाई-एंड रिटचिंग" },
      { href: "./arch-viz-work", title: "आर्क विज़" },
    ],
  },
  "/explainer-videos": {
    metaTitle: "2D एक्सप्लेनर वीडियोज़ | Sanidhya Singh",
    metaDescription:
      "लॉन्च, प्रोडक्ट्स और डिजिटल कम्युनिकेशन के लिए 2D एक्सप्लेनर वीडियो काम का एक केंद्रित चयन।",
    title: "2D एक्सप्लेनर वीडियोज़",
    description:
      "मोशन-आधारित स्टोरीटेलिंग जो ऑफर को तेज़ी से स्पष्ट करती है और लॉन्च को अधिक polished महसूस कराती है।",
    focusItems: [
      "प्रोडक्ट एक्सप्लेनर्स",
      "लॉन्च टीज़र मोशन",
      "सोशल कटडाउन और looped clips",
      "फीचर breakdown sequences",
    ],
    bestForTitle: "ऐसे डिजिटल प्रोडक्ट्स, लॉन्च और कैंपेन के लिए जिन्हें speed के साथ polish चाहिए।",
    bestForText:
      "जब किसी concept को web, ads और presentations में जल्दी समझाना और साफ़ तरीके से यादगार बनाना हो।",
    linkedTitle: "मोशन डिज़ाइन और ऐनिमेटेड कंटेंट",
    linkedText:
      "ऐसा animation जो messaging को जल्दी उतारे और overall brand impression को ऊँचा रखे।",
    viewHref: "./motion-design",
    inquireHref: "/hi/contact?service=motion-design",
    cases: [
      {
        index: "01",
        title: "फीचर breakdown sequence",
        body: "एक साफ़ animated explainer structure जो product features को तेज़ और premium viewing experience में बदल देता है।",
        wide: true,
        preview: "motion-design",
        style: "background-position:center 24%;",
      },
      {
        index: "02",
        title: "लॉन्च टीज़र loop",
        body: "लैंडिंग पेज, social rollout और digital launch countdowns के लिए बनाई गई short-form motion।",
        preview: "motion-design",
        style: "background-position:center 48%;",
      },
      {
        index: "03",
        title: "सोशल कटडाउन पैक",
        body: "ऐसे adapted motion fragments जो कई placements में भी campaign language को consistent रखते हैं।",
        preview: "motion-design",
        style: "background-position:center 70%;",
      },
    ],
    relatedItems: [
      { href: "./campaign-visuals", title: "कैंपेन विज़ुअल्स" },
      { href: "./brand-identity-systems-work", title: "ब्रांड आइडेंटिटी सिस्टम्स" },
      { href: "./product-renders", title: "प्रोडक्ट रेंडर्स" },
      { href: "./game-ui-icons", title: "गेम UI और आइकन्स" },
    ],
  },
  "/campaign-visuals": {
    metaTitle: "कैंपेन विज़ुअल्स | Sanidhya Singh",
    metaDescription:
      "लॉन्च चैनलों में visibility और consistency के लिए कैंपेन विज़ुअल काम का एक केंद्रित चयन।",
    title: "कैंपेन विज़ुअल्स",
    description:
      "मार्केट-फेसिंग विज़ुअल्स जो launch channels के पार sharp, visible और consistent महसूस हों।",
    focusItems: [
      "की-विज़ुअल डेवलपमेंट",
      "पोस्टर और इवेंट ग्राफिक्स",
      "पेड सोशल क्रिएटिव",
      "डिजिटल रोलआउट सिस्टम्स",
    ],
    bestForTitle: "ऐसे कैंपेन के लिए जिन्हें speed, visibility और polished visual point of view चाहिए।",
    bestForText:
      "उन brands, agencies और teams के लिए उपयोगी जो social, event और launch touchpoints पर एक साथ काम कर रहे हों।",
    linkedTitle: "कैंपेन डिज़ाइन और मार्केटिंग विज़ुअल्स",
    linkedText:
      "ऐसे campaign graphics जो एक साफ़ visual idea को कई formats और placements में carry कर सकें।",
    viewHref: "./campaign-design",
    inquireHref: "/hi/contact?service=campaign-design",
    cases: [
      {
        index: "01",
        title: "की-विज़ुअल पोस्टर",
        body: "एक lead image system जो पूरे campaign को anchor करे और large-format से digital placements तक टिके।",
        wide: true,
        preview: "campaign-design",
        style: "background-position:center 18%;",
      },
      {
        index: "02",
        title: "पेड सोशल rollout",
        body: "Campaign crops और ad variants का ऐसा set जो assembled नहीं बल्कि unified महसूस हो।",
        preview: "campaign-design",
        style: "background-position:center 52%;",
      },
      {
        index: "03",
        title: "इवेंट लॉन्च पैक",
        body: "पोस्टर्स, digital screens और launch graphics को एक sharp market-facing visual direction में align किया गया।",
        preview: "campaign-design",
        style: "background-position:center 72%;",
      },
    ],
    relatedItems: [
      { href: "./brand-identity-systems-work", title: "ब्रांड आइडेंटिटी सिस्टम्स" },
      { href: "./explainer-videos", title: "2D एक्सप्लेनर वीडियोज़" },
      { href: "./product-renders", title: "प्रोडक्ट रेंडर्स" },
      { href: "./editorial-illustration", title: "एडिटोरियल इलस्ट्रेशन" },
    ],
  },
  "/editorial-illustration": {
    metaTitle: "एडिटोरियल इलस्ट्रेशन | Sanidhya Singh",
    metaDescription:
      "स्वर, मूड और narrative clarity जोड़ने वाले illustration-led work का एक केंद्रित चयन।",
    title: "एडिटोरियल इलस्ट्रेशन",
    description:
      "इलस्ट्रेशन-आधारित स्टोरीटेलिंग जो visual message में taste, mood और narrative clarity जोड़ती है।",
    focusItems: [
      "कवर-लेड विज़ुअल्स",
      "स्पॉट इलस्ट्रेशन सिस्टम्स",
      "नैरेटिव इमेज-मेकिंग",
      "कॉन्सेप्ट-ड्रिवन फीचर आर्टवर्क",
    ],
    bestForTitle: "ऐसी stories, campaigns और brand worlds के लिए जिन्हें stronger visual voice चाहिए।",
    bestForText:
      "जब photography अकेले project की tone, concept या specificity को carry नहीं कर सकती।",
    linkedTitle: "इलस्ट्रेशन और विज़ुअल डेवलपमेंट",
    linkedText:
      "ऐसा bespoke artwork और visual language जो authored, distinctive और intentional महसूस हो।",
    viewHref: "./illustration",
    inquireHref: "/hi/contact?service=illustration",
    cases: [
      {
        index: "01",
        title: "कवर-लेड narrative image",
        body: "ऐसा इलस्ट्रेशन जो पूरी कहानी को anchor करे और भावनात्मक तापमान तुरंत सेट कर दे।",
        wide: true,
        preview: "illustration",
        style: "background-position:center 22%;",
      },
      {
        index: "02",
        title: "स्पॉट इलस्ट्रेशन सिस्टम",
        body: "छोटे supporting visuals की family जो कई placements में भी narrative को consistent रखे।",
        preview: "illustration",
        style: "background-position:center 54%;",
      },
      {
        index: "03",
        title: "इलस्ट्रेटेड फीचर स्प्रेड",
        body: "Concept-led artwork जो attention पकड़ कर editorial presentation में अधिक authorship जोड़ता है।",
        preview: "illustration",
        style: "background-position:center 74%;",
      },
    ],
    relatedItems: [
      { href: "./brand-identity-systems-work", title: "ब्रांड आइडेंटिटी सिस्टम्स" },
      { href: "./campaign-visuals", title: "कैंपेन विज़ुअल्स" },
      { href: "./game-ui-icons", title: "गेम UI और आइकन्स" },
      { href: "./explainer-videos", title: "2D एक्सप्लेनर वीडियोज़" },
    ],
  },
  "/game-ui-icons": {
    metaTitle: "गेम UI और आइकन्स | Sanidhya Singh",
    metaDescription:
      "गेम-फेसिंग इंटरफ़ेस, HUD और आइकन सिस्टम्स का एक केंद्रित चयन।",
    title: "गेम UI और आइकन्स",
    description:
      "गेम-फेसिंग इंटरफ़ेस काम जो interaction को अधिक clear, sharp और immersive बनाता है।",
    focusItems: [
      "HUD direction और screen hierarchy",
      "Skill और item icon families",
      "Menu और inventory design",
      "Interaction clarity और visual readability",
    ],
    bestForTitle: "ऐसे games और interactive projects के लिए जिन्हें मजबूत visual usability चाहिए।",
    bestForText:
      "जब interface को worldbuilding support भी करना हो और clarity, pacing तथा system readability भी बनाए रखनी हो।",
    linkedTitle: "गेम आर्ट और इंटरैक्टिव विज़ुअल डिज़ाइन",
    linkedText:
      "ऐसे interactive visual systems जो clarity, atmosphere और production usefulness के बीच संतुलन रखते हों।",
    viewHref: "./game-art",
    inquireHref: "/hi/contact?service=game-art",
    cases: [
      {
        index: "01",
        title: "HUD direction system",
        body: "Gameplay-facing interface pass जो hierarchy, readability और overall polish को बेहतर बनाता है।",
        wide: true,
        preview: "game-art",
        style: "background-position:center 20%;",
      },
      {
        index: "02",
        title: "Skill icon family",
        body: "ऐसा icon set जो abilities को distinct रखे और फिर भी एक ही visual world का हिस्सा लगे।",
        preview: "game-art",
        style: "background-position:center 50%;",
      },
      {
        index: "03",
        title: "Menu और inventory polish",
        body: "Supporting interface design जो secondary screens को भी core gameplay view जितना considered महसूस कराए।",
        preview: "game-art",
        style: "background-position:center 76%;",
      },
    ],
    relatedItems: [
      { href: "./editorial-illustration", title: "एडिटोरियल इलस्ट्रेशन" },
      { href: "./explainer-videos", title: "2D एक्सप्लेनर वीडियोज़" },
      { href: "./brand-identity-systems-work", title: "ब्रांड आइडेंटिटी सिस्टम्स" },
      { href: "./product-renders", title: "प्रोडक्ट रेंडर्स" },
    ],
  },
  "/arch-viz-work": {
    metaTitle: "आर्क विज़ | Sanidhya Singh",
    metaDescription:
      "स्पैशियल प्रोजेक्ट्स के लिए presentation-led architectural visualization work का एक चयन।",
    title: "आर्क विज़",
    description:
      "ऐसे spatial visuals जो clients को real world में बनने से पहले ही finished outcome देखने में मदद करें।",
    focusItems: [
      "Exterior hero renders",
      "Interior mood frames",
      "Material और lighting studies",
      "Stakeholder presentation visuals",
    ],
    bestForTitle: "रियल एस्टेट, आर्किटेक्चर और spatial presentations के लिए जिन्हें जल्दी conviction चाहिए।",
    bestForText:
      "जब decision इस बात पर निर्भर हो कि construction, staging या rollout से पहले final space पर लोग भरोसा कर पाते हैं या नहीं।",
    linkedTitle: "आर्किटेक्चरल और स्पैशियल विज़ुअलाइज़ेशन",
    linkedText:
      "ऐसी spatial imagery जो approvals, launches और physical environments की marketing को support करे।",
    viewHref: "./architectural-visualization",
    inquireHref: "/hi/contact?service=architectural-visualization",
    cases: [
      {
        index: "01",
        title: "Exterior hero perspective",
        body: "एक presentation-first render जो एक नज़र में project vision बेचने के लिए बनाया गया है।",
        wide: true,
        preview: "architectural-visualization",
        style: "background-position:center 22%;",
      },
      {
        index: "02",
        title: "Interior mood frame",
        body: "ऐसा interior-focused view जो finish, light और atmosphere को believable तरीके से communicate करे।",
        preview: "architectural-visualization",
        style: "background-position:center 56%;",
      },
      {
        index: "03",
        title: "Presentation board sequence",
        body: "Stakeholder review, sales presentations और project storytelling के लिए shaped supporting render set।",
        preview: "architectural-visualization",
        style: "background-position:center 74%;",
      },
    ],
    relatedItems: [
      { href: "./product-renders", title: "प्रोडक्ट रेंडर्स" },
      { href: "./campaign-visuals", title: "कैंपेन विज़ुअल्स" },
      { href: "./high-end-retouching", title: "हाई-एंड रिटचिंग" },
      { href: "./brand-identity-systems-work", title: "ब्रांड आइडेंटिटी सिस्टम्स" },
    ],
  },
};

const buildBrandIdentitySystemsHindiMarkup = () => `
  <section class="page-hero"><p class="eyebrow">काम</p><h1>ब्रांड आइडेंटिटी सिस्टम्स</h1><p>ऐसा identity work जो ब्रांड को पहले दिन से coherent, scalable और visibly premium महसूस कराए।</p></section>
  <section class="split-section"><div class="page-grid"><article class="detail-card"><p class="service-index">फोकस</p><ul><li>मुख्य लोगो दिशा</li><li>रिस्पॉन्सिव लॉकअप्स और वैरिएंट्स</li><li>टाइपोग्राफी और कलर सिस्टम्स</li><li>लॉन्च-रेडी ब्रांड rollout assets</li></ul></article><article class="detail-card"><p class="service-index">कब उपयोगी</p><h3>उन founders, launches और rebrands के लिए जिन्हें अधिक visual authority चाहिए।</h3><p>सबसे उपयोगी तब, जब brand को digital touchpoints, campaigns और presentation contexts के पार consistent महसूस होना चाहिए।</p></article></div><aside class="panel-card"><p class="service-index">जुड़ी हुई सेवा</p><h3>ब्रांड आइडेंटिटी और विज़ुअल सिस्टम्स</h3><p>उन distinctive brands के लिए जो clarity, consistency और stronger point of view चाहते हैं।</p><div class="work-case-actions"><a class="button button-secondary" href="./brand-identity">सेवा देखें</a><a class="button button-secondary" href="/hi/contact?service=brand-identity">पूछताछ करें</a></div></aside></section>
  <section class="work-case-grid work-case-grid--brand-identity">
    <article class="work-case-card is-wide work-case-card--video" data-preview="brand-identity" data-brand-media="title-card">
      <div class="work-case-media work-case-media-video">
        <video class="work-case-video" controls loop playsinline preload="auto">
          <source src="./assets/videos/movie-title-card.mp4" type="video/mp4">
        </video>
      </div>
      <div class="work-case-copy">
        <p class="service-index">01</p>
        <h3>टाइटल कार्ड मोशन</h3>
        <p>एक branded opening card जो posters, decks और rollout graphics से पहले सही tone के साथ identity को introduce करता है।</p>
      </div>
    </article>
    <article class="work-case-card" data-preview="brand-identity" data-brand-media="thumbnail">
      <div class="work-case-media" style="background-position:center 46%;"></div>
      <div class="work-case-copy">
        <p class="service-index">02</p>
        <h3>YouTube थंबनेल</h3>
        <p>ऐसा thumbnail जो तुरंत attention पकड़े और छोटे आकार में भी identity को साफ़ तरीके से translate करे।</p>
      </div>
    </article>
    <article class="work-case-card" data-preview="brand-identity" data-brand-media="rollout">
      <div class="work-case-media" style="background-position:center 58%;"></div>
      <div class="work-case-copy">
        <p class="service-index">03</p>
        <h3>पोस्टर और rollout graphics</h3>
        <p>ऐसा flexible brand graphics area जो posters, announcement assets और अन्य supporting visuals के साथ identity को आगे बढ़ाए।</p>
      </div>
    </article>
  </section>
  <section class="related-services"><div class="section-heading narrow"><p class="eyebrow">और काम</p><h2>करीबी काम के प्रकार देखें।</h2></div><div class="related-grid"><a class="related-link" href="./campaign-visuals"><p>संबंधित</p><h3>कैंपेन विज़ुअल्स</h3></a><a class="related-link" href="./product-renders"><p>संबंधित</p><h3>प्रोडक्ट रेंडर्स</h3></a><a class="related-link" href="./editorial-illustration"><p>संबंधित</p><h3>एडिटोरियल इलस्ट्रेशन</h3></a><a class="related-link" href="./explainer-videos"><p>संबंधित</p><h3>2D एक्सप्लेनर वीडियोज़</h3></a></div></section>
`;

const buildHighEndRetouchingHindiMarkup = () => `
  <section class="page-hero"><p class="eyebrow">काम</p><h1>हाई-एंड रिटचिंग</h1><p>ऐसा image refinement जो distractions हटाए, finish elevate करे और final frame को commercial use के लिए तैयार महसूस कराए।</p></section>
  <section class="split-section"><div class="page-grid"><article class="detail-card"><p class="service-index">फोकस</p><ul><li>लक्ज़री cleanup और polish</li><li>Compositing refinement</li><li>प्रोडक्ट और portrait finishing</li><li>लॉन्च-रेडी commercial presentation</li></ul></article><article class="detail-card"><p class="service-index">कब उपयोगी</p><h3>उन इमेजेज़ के लिए जो लगभग तैयार हैं, पर अभी भी एक sharper और अधिक premium अंतिम pass चाहती हैं।</h3><p>जब composition सही हो, लेकिन detail cleanup, balance और finish अभी भी result को सीमित कर रहे हों।</p></article></div><aside class="panel-card"><p class="service-index">जुड़ी हुई सेवा</p><h3>रिटचिंग और इमेज रिफाइनमेंट</h3><p>ऐसा final-stage cleanup और enhancement जो clarity, polish और presentation value को मजबूत करे।</p><div class="work-case-actions"><a class="button button-secondary" href="./retouching">सेवा देखें</a><a class="button button-secondary" href="/hi/contact?service=retouching">पूछताछ करें</a></div></aside></section>
  <section class="work-case-grid work-case-grid--retouching">
    <article class="work-case-card" data-retouching-case="wedding">
      <div class="work-case-media work-case-media-compare">
        <div class="work-compare" data-compare-slider data-compare-start="50">
          <div class="work-compare-stage">
            <img class="work-compare-image work-compare-image--after" alt="Wedding retouch after" data-primary="./assets/images/retouching-wedding-after.webp" data-fallback="./assets/images/Wedding-Retouch.webp">
            <div class="work-compare-before">
              <img class="work-compare-image work-compare-image--before" alt="Wedding retouch before" data-primary="./assets/images/retouching-wedding-before.webp" data-fallback="./assets/images/Wedding-Retouch.webp">
            </div>
            <div class="work-compare-divider" aria-hidden="true"><span class="work-compare-handle"></span></div>
            <span class="work-compare-label work-compare-label--before">पहले</span>
            <span class="work-compare-label work-compare-label--after">बाद में</span>
            <input class="work-compare-range" type="range" min="0" max="100" value="50" aria-label="वेडिंग रिटच का पहले और बाद का तुलना स्लाइडर">
          </div>
        </div>
      </div>
      <div class="work-case-copy">
        <p class="service-index">01</p>
        <h3>वेडिंग रिटच और finish</h3>
        <p>ऐसा refined cleanup pass जो album selects और hero frames में tone, skin, fabric और atmosphere को elevate करे।</p>
      </div>
    </article>
    <article class="work-case-card" data-retouching-case="jewelry">
      <div class="work-case-media work-case-media-compare">
        <div class="work-compare" data-compare-slider data-compare-start="48">
          <div class="work-compare-stage">
            <img class="work-compare-image work-compare-image--after" alt="Jewelry retouch after" data-primary="./assets/images/retouching-jewelry-after.webp" data-fallback="./assets/images/Jewelry-Retouch.webp">
            <div class="work-compare-before">
              <img class="work-compare-image work-compare-image--before" alt="Jewelry retouch before" data-primary="./assets/images/retouching-jewelry-before.webp" data-fallback="./assets/images/Jewelry-Retouch.webp">
            </div>
            <div class="work-compare-divider" aria-hidden="true"><span class="work-compare-handle"></span></div>
            <span class="work-compare-label work-compare-label--before">पहले</span>
            <span class="work-compare-label work-compare-label--after">बाद में</span>
            <input class="work-compare-range" type="range" min="0" max="100" value="48" aria-label="ज्वेलरी रिटच का पहले और बाद का तुलना स्लाइडर">
          </div>
        </div>
      </div>
      <div class="work-case-copy">
        <p class="service-index">02</p>
        <h3>ज्वेलरी रिटच</h3>
        <p>Reflections, micro-details और material clarity के लिए precision cleanup ताकि luxury products और sharp तथा premium पढ़ें।</p>
      </div>
    </article>
    <article class="work-case-card" data-retouching-case="skin">
      <div class="work-case-media work-case-media-compare">
        <div class="work-compare" data-compare-slider data-compare-start="52">
          <div class="work-compare-stage">
            <img class="work-compare-image work-compare-image--after" alt="Skin retouch after" data-primary="./assets/images/retouching-skin-after.webp" data-fallback="./assets/images/Skin-Retouch.webp">
            <div class="work-compare-before">
              <img class="work-compare-image work-compare-image--before" alt="Skin retouch before" data-primary="./assets/images/retouching-skin-before.webp" data-fallback="./assets/images/Skin-Retouch.webp">
            </div>
            <div class="work-compare-divider" aria-hidden="true"><span class="work-compare-handle"></span></div>
            <span class="work-compare-label work-compare-label--before">पहले</span>
            <span class="work-compare-label work-compare-label--after">बाद में</span>
            <input class="work-compare-range" type="range" min="0" max="100" value="52" aria-label="स्किन रिटच का पहले और बाद का तुलना स्लाइडर">
          </div>
        </div>
      </div>
      <div class="work-case-copy">
        <p class="service-index">03</p>
        <h3>स्किन रिटच</h3>
        <p>ऐसा high-end beauty polish जो texture control, tonal balance और cleaner finish देता है, बिना realism खोए।</p>
      </div>
    </article>
    <article class="work-case-card" data-retouching-case="watch">
      <div class="work-case-media work-case-media-compare">
        <div class="work-compare" data-compare-slider data-compare-start="50">
          <div class="work-compare-stage">
            <img class="work-compare-image work-compare-image--after" alt="Watch retouch after" data-primary="./assets/images/retouching-watch-after.webp" data-fallback="./assets/images/Watch-Retouch.webp">
            <div class="work-compare-before">
              <img class="work-compare-image work-compare-image--before" alt="Watch retouch before" data-primary="./assets/images/retouching-watch-before.webp" data-fallback="./assets/images/Watch-Retouch.webp">
            </div>
            <div class="work-compare-divider" aria-hidden="true"><span class="work-compare-handle"></span></div>
            <span class="work-compare-label work-compare-label--before">पहले</span>
            <span class="work-compare-label work-compare-label--after">बाद में</span>
            <input class="work-compare-range" type="range" min="0" max="100" value="50" aria-label="वॉच रिटच का पहले और बाद का तुलना स्लाइडर">
          </div>
        </div>
      </div>
      <div class="work-case-copy">
        <p class="service-index">04</p>
        <h3>वॉच रिटच</h3>
        <p>Dial detail, metal surfaces और luxury presentation imagery के लिए controlled finish pass, जो listings और campaigns में काम आए।</p>
      </div>
    </article>
  </section>
  <section class="related-services"><div class="section-heading narrow"><p class="eyebrow">और काम</p><h2>करीबी काम के प्रकार देखें।</h2></div><div class="related-grid"><a class="related-link" href="./product-renders"><p>संबंधित</p><h3>प्रोडक्ट रेंडर्स</h3></a><a class="related-link" href="./campaign-visuals"><p>संबंधित</p><h3>कैंपेन विज़ुअल्स</h3></a><a class="related-link" href="./editorial-illustration"><p>संबंधित</p><h3>एडिटोरियल इलस्ट्रेशन</h3></a><a class="related-link" href="./brand-identity-systems-work"><p>संबंधित</p><h3>ब्रांड आइडेंटिटी सिस्टम्स</h3></a></div></section>
`;

const buildHindiFreebiesMarkup = () => `
  <section class="section-heading services-heading">
    <h1>FREEBIES</h1>
  </section>
  <section class="page-grid">
    <article class="detail-card freebies-gate-card">
      <p class="service-index">एक्सेस</p>
      <h3>फ्री डाउनलोडेबल रिसोर्सेज़</h3>
      <p>आगे बढ़ने और hidden downloads page पर जाने के लिए password दर्ज करें।</p>
      <form class="freebies-unlock" id="freebies-unlock" data-password="sanidhya26">
        <label class="sr-only" for="freebies-password">Password</label>
        <input class="freebies-password-input" id="freebies-password" name="password" type="password" placeholder="Password दर्ज करें" autocomplete="current-password">
        <button class="button button-primary freebies-unlock-button" type="submit">Got it</button>
      </form>
      <p class="freebies-status" id="freebies-status" aria-live="polite">Freebies unlock करने के लिए password आवश्यक है।</p>
    </article>
    <article class="detail-card">
      <p class="service-index">क्या मिलेगा</p>
      <h3>उपयोगी, polished और सीधे इस्तेमाल करने लायक</h3>
      <p>Creative brief templates, brand audit checklists, presentation frameworks, mockup assets और ready-to-use visual resources की उम्मीद करें।</p>
    </article>
  </section>
`;

const buildHindiHiddenMarkup = () => `
  <section class="section-heading services-heading">
    <h1>HIDDEN</h1>
  </section>
  <section class="freebies-downloads">
    <div class="page-grid freebies-download-grid">
      <article class="detail-card freebies-download-card"><a class="button button-secondary" href="./downloads/creative-brief-template.md" download>डाउनलोड</a></article>
      <article class="detail-card freebies-download-card"><a class="button button-secondary" href="./downloads/brand-audit-checklist.md" download>डाउनलोड</a></article>
      <article class="detail-card freebies-download-card"><a class="button button-secondary" href="./downloads/presentation-framework.md" download>डाउनलोड</a></article>
      <article class="detail-card freebies-download-card"><a class="button button-secondary" href="./downloads/launch-asset-checklist.md" download>डाउनलोड</a></article>
    </div>
  </section>
`;

const buildHindiMaintenanceMarkup = () => `
  <section class="page-hero error-page-hero">
    <p class="service-index error-code">अस्थायी</p>
    <h1>साइट maintenance पर है।</h1>
    <p>साइट इस समय अपडेट हो रही है। कृपया थोड़ी देर बाद वापस आएँ और नया काम, सेवाएँ और resources देखें।</p>
    <div class="error-actions">
      <a class="button button-primary" href="/hi/contact">संपर्क</a>
      <a class="button button-secondary" href="mailto:singhsanidhya13@gmail.com">सीधे ईमेल करें</a>
    </div>
  </section>
  <section class="page-grid">
    <article class="detail-card">
      <p class="service-index">स्थिति</p>
      <h3>साइट अनुभव को नया किया जा रहा है</h3>
      <p>Visual updates, content refinements और portfolio improvements अभी roll out किए जा रहे हैं।</p>
    </article>
    <article class="panel-card">
      <p class="service-index">कुछ तुरंत चाहिए?</p>
      <h3>सीधे संपर्क करें, मैं वापस जवाब दूँगा।</h3>
      <p>अगर आपकी inquiry समय-संवेदी है, तो site offline रहते हुए email सबसे तेज़ तरीका है।</p>
    </article>
  </section>
`;

const buildHindi404Markup = () => `
  <section class="page-hero error-page-hero">
    <p class="service-index error-code">404</p>
    <h1>पेज नहीं मिला।</h1>
    <p>जिस पेज को आप खोलना चाहते थे वह मौजूद नहीं है, शायद move हो गया है या link broken है।</p>
    <div class="error-actions">
      <a class="button button-primary" href="/hi">होम पर जाएँ</a>
      <a class="button button-secondary" href="/hi/services">सेवाएँ देखें</a>
    </div>
  </section>
  <section class="related-services error-nav">
    <div class="related-grid">
      <a class="related-link" href="/hi/work"><p>देखें</p><h3>काम</h3></a>
      <a class="related-link" href="/hi/services"><p>देखें</p><h3>सेवाएँ</h3></a>
      <a class="related-link" href="/hi/about"><p>पढ़ें</p><h3>परिचय</h3></a>
      <a class="related-link" href="/hi/contact"><p>शुरू करें</p><h3>संपर्क</h3></a>
    </div>
  </section>
`;

const buildHindiTermsMarkup = () => `
  <div class="section-heading services-heading terms-heading">
    <h1>सेवाओं की शर्तें</h1>
  </div>
  <section class="page-hero terms-hero">
    <p>ये शर्तें Sanidhya Singh द्वारा दी जाने वाली सभी design services पर लागू होती हैं, जब तक कोई अलग written agreement इन्हें override न करे। इनमें logo design, brand identity, campaign design, illustration, game art, motion design, 3D visualization, architectural visualization, retouching और related creative services शामिल हैं। Proposal approve करने, deposit देने, invoice भरने या काम शुरू करने के निर्देश देने पर client इन शर्तों और project proposal, estimate, invoice या statement of work के साथ बंधा हुआ माना जाएगा।</p>
    <p class="terms-fine-print">यदि किसी proposal, statement of work या signed agreement में इन terms से टकराव हो, तो वही project-specific document प्राथमिक माना जाएगा।</p>
  </section>
  <section class="terms-layout">
    <div class="terms-stack">
      <article class="detail-card terms-card is-wide"><p class="service-index">01</p><h3>स्वीकृति और स्कोप</h3><p>प्रोजेक्ट तब शुरू माना जाएगा जब client proposal को लिखित रूप में स्वीकार करे, deposit दे, या Sanidhya Singh को काम शुरू करने का निर्देश दे। agreed scope में केवल वही services, deliverables, formats, timelines और revision rounds शामिल होंगे जो accepted proposal, estimate, invoice या statement of work में लिखे हों।</p><p>जो भी item scope में स्पष्ट रूप से शामिल नहीं है, उसे अतिरिक्त सेवा माना जाएगा और उसके लिए revised timeline, quote या change order की आवश्यकता हो सकती है। इसमें extra concepts, additional deliverables, expanded usage rights, extra languages, extra export formats, source file release और extra revisions शामिल हो सकते हैं।</p></article>
      <article class="detail-card terms-card"><p class="service-index">02</p><h3>Pricing, deposits, payment और taxes</h3><p>Quotes और estimates उतने समय तक मान्य हैं जितना proposal में लिखा हो, या यदि अवधि न दी गई हो तो issue होने के 14 calendar days तक। काम शुरू होने से पहले non-refundable deposit की आवश्यकता हो सकती है। जब तक लिखित रूप में कुछ और न कहा गया हो, final deliverables रिलीज़ होने से पहले balance देय होगा।</p><ul><li>Invoices invoice में लिखी अवधि के भीतर देय हैं।</li><li>Late payment से project pause हो सकता है और delivery delay हो सकती है।</li><li>Bank charges, processor fees, taxes, duties या withholding taxes client की जिम्मेदारी होंगे जब तक स्पष्ट रूप से कुछ और न कहा गया हो।</li><li>पूर्ण भुगतान तक final files, rights transfer या launch-ready exports रोके जा सकते हैं।</li></ul></article>
      <article class="detail-card terms-card"><p class="service-index">03</p><h3>Timelines, client delays और suspension</h3><p>Timelines estimate हैं जब तक कोई fixed deadline लिखित रूप में तय न की गई हो। Delivery dates timely feedback, approvals, content supply और payment पर निर्भर करती हैं। यदि client feedback delay करे, approvals miss करे या material देर से दे, तो timeline उसी अनुसार बदल सकती है।</p><p>यदि client delay के कारण project 14 days या अधिक inactive रहता है, तो उसे hold पर रखा जा सकता है और बाद में availability के अनुसार schedule में वापस लिया जाएगा। 30 days या अधिक inactivity होने पर project को abandoned माना जा सकता है या current rates पर re-quote किया जा सकता है।</p></article>
      <article class="detail-card terms-card"><p class="service-index">04</p><h3>Revisions, feedback और approvals</h3><p>Revision rounds उतने ही होंगे जितने proposal में शामिल हैं। Revisions का मतलब agreed direction के भीतर बदलाव है। Direction change, नए brief का major shift या approved work का restart सामान्य revisions से बाहर है और अलग quote किया जा सकता है।</p><p>Client की जिम्मेदारी है कि proofs, previews, mockups, animations, renders और exports को approval से पहले ध्यान से review करे। किसी stage, concept या final file के approve होने के बाद अतिरिक्त बदलावों पर extra fee लग सकती है।</p></article>
      <article class="detail-card terms-card"><p class="service-index">05</p><h3>Delivery, file formats और source files</h3><p>Final deliverables उन्हीं formats में दिए जाएँगे जो proposal में लिखे गए हों। जब तक स्पष्ट रूप से शामिल न हो, editable working files, raw project files, layered source files, libraries, scene files या software setup files शामिल नहीं होंगे।</p><ul><li>Logo और identity काम में PNG, SVG, PDF, EPS या JPG जैसे standard exports शामिल हो सकते हैं।</li><li>Motion work में rendered files शामिल हो सकती हैं, पर editable timeline files तभी जब पहले से agreed हों।</li><li>3D work में renders, turntables या agreed scene exports शामिल हो सकते हैं, पर full production source files नहीं जब तक अलग से तय न हो।</li><li>Retouching work में final image exports शामिल होंगे, layered source delivery तभी जब विशेष रूप से quote किया गया हो।</li></ul></article>
      <article class="detail-card terms-card"><p class="service-index">06</p><h3>Fonts, stock, plugins, music, models और third-party licenses</h3><p>Project में इस्तेमाल होने वाला कोई भी third-party asset अपने license terms के अधीन रहेगा। इसमें fonts, stock images, stock video, music, sound effects, templates, plugins, brush packs, 3D assets, HDRIs और software-bound libraries शामिल हैं।</p><ul><li>Commercial use, team use, editing use या redistribution के लिए आवश्यक license लेना और बनाए रखना client की जिम्मेदारी है।</li><li>Sanidhya Singh किसी personal या non-transferable license को transfer करने के लिए बाध्य या अधिकृत नहीं है।</li><li>जहाँ संभव होगा, final approval से पहले ऐसे third-party licensed elements की जानकारी client को दी जाएगी।</li></ul></article>
      <article class="detail-card terms-card"><p class="service-index">07</p><h3>Ownership, copyright और portfolio rights</h3><p>सभी concepts, drafts, sketches, working files, tests, source files, unused explorations और production materials Sanidhya Singh की property रहेंगे, जब तक उन्हें लिखित रूप में transfer न किया जाए। Final approved deliverables के rights केवल full payment के बाद client को transfer होते हैं।</p><ul><li>Unused concepts और rejected directions Sanidhya Singh की property रहेंगे।</li><li>Final paid deliverables client agreed purpose के लिए इस्तेमाल कर सकता है, proposal या license में दिए गए limits के अनुसार।</li><li>यदि confidentiality या NDA लागू नहीं है, तो finished work, selected process imagery और project summaries portfolio, social media, awards submissions और self-promotion में दिखाए जा सकते हैं।</li><li>Rights transfer में third-party licenses या non-transferable software assets शामिल नहीं हैं।</li></ul></article>
      <article class="detail-card terms-card is-wide"><p class="service-index">08</p><h3>Service-specific terms</h3><ul><li><strong>Brand identity और logo design:</strong> trademark clearance, name clearance और business registration checks client की जिम्मेदारी हैं। Design work legal trademark advice नहीं है।</li><li><strong>Illustration और game art:</strong> deliverables केवल visual assets हैं, जब तक technical integration, slicing, rigging, export setup या implementation support स्पष्ट रूप से शामिल न हो।</li><li><strong>Motion design:</strong> timing, voiceover, music, subtitles, render resolutions और aspect ratios client approval के अधीन हैं; extra cutdowns या alternate versions अलग quote हो सकते हैं।</li><li><strong>3D product और architectural visualization:</strong> renders और mockups visual representations हैं, engineering drawings, construction documents या certified technical instructions नहीं।</li><li><strong>Architectural और spatial visuals:</strong> accuracy client या उनके consultants द्वारा दिए गए drawings, measurements, references और specifications पर निर्भर करती है।</li><li><strong>Retouching और image refinement:</strong> final quality source image quality, resolution, lighting और file condition पर निर्भर करती है। supplied material की सीमाओं के लिए ज़िम्मेदारी नहीं ली जाएगी।</li></ul></article>
      <article class="detail-card terms-card"><p class="service-index">09</p><h3>Cancellation, pause और abandonment</h3><p>यदि client काम शुरू होने के बाद project cancel करता है, तो completed work, reserved time और administrative costs के अनुपात में किए गए payments non-refundable होंगे। यदि concepts, drafts, layouts या renders deliver हो चुके हैं, तो Sanidhya Singh पहले से paid fees retain कर सकता है और अतिरिक्त completed work के लिए invoice जारी कर सकता है।</p><p>यदि बीमारी, आपातकाल या किसी गंभीर unforeseen circumstance के कारण project पूरा नहीं हो पाता, तो unearned fees का उचित हिस्सा refund किया जा सकता है और जहाँ उचित हो partial work deliver किया जा सकता है।</p></article>
      <article class="detail-card terms-card"><p class="service-index">10</p><h3>Client responsibilities और warranties</h3><p>Client यह warrant करता है कि project के लिए दिया गया text, imagery, footage, data, brand names, product claims, references और materials intended purpose के लिए lawfully इस्तेमाल किए जा सकते हैं। Supplied content की accuracy, legality और final approval client की जिम्मेदारी है।</p><ul><li>Client को timely feedback और clear decision-making देना होगा।</li><li>जहाँ आवश्यक हो, legal, regulatory, trademark, naming और compliance checks client को स्वयं करने होंगे।</li><li>Deliverables का requested use platform rules, advertising standards और लागू कानूनों के अनुरूप हो यह सुनिश्चित करना client की जिम्मेदारी है।</li></ul></article>
      <article class="detail-card terms-card is-wide"><p class="service-index">11</p><h3>Confidentiality और NDAs</h3><p>जो भी जानकारी स्पष्ट रूप से confidential बताई गई होगी उसे confidential माना जाएगा और केवल project पूरा करने के उद्देश्य से इस्तेमाल किया जाएगा। यदि client formal confidentiality obligations या mutual NDA चाहता है, तो project शुरू होने से पहले इसकी request करनी चाहिए।</p></article>
      <article class="detail-card terms-card is-wide"><p class="service-index">12</p><h3>Disclaimers और limitation of liability</h3><p>कानून द्वारा अनुमत सीमा तक, Sanidhya Singh किसी indirect, incidental, special, consequential, exemplary या business-interruption loss के लिए liable नहीं होगा जो services, deliverables, delays, approvals, third-party assets या finished work के use से संबंधित हो।</p><p>Creative services में subjective judgment और iterative development शामिल होते हैं। जब तक लिखित रूप में स्पष्ट न हो, commercial performance, audience response, conversion rates, platform approval, trademark registrability, legal clearance, engineering suitability, manufacturing fitness या construction feasibility की कोई guarantee नहीं दी जाती।</p><p>कानून द्वारा अनुमत सीमा तक, किसी भी project से arising total liability उसी specific project के लिए client द्वारा वास्तव में paid fees तक सीमित होगी। जहाँ कानून ऐसे exclusion की अनुमति नहीं देता, वहाँ संबंधित remedies बने रहेंगे।</p></article>
      <article class="detail-card terms-card"><p class="service-index">13</p><h3>Force majeure</h3><p>यदि reasonable control से बाहर की घटनाओं, जैसे major technical outages, natural disasters, war, civil unrest, labor disruption, internet failure, government restrictions या serious illness के कारण delay या failure होता है, तो किसी पक्ष को liable नहीं माना जाएगा, बशर्ते affected party यथाशीघ्र notice दे और सक्षम होने पर performance फिर शुरू करे।</p></article>
      <article class="detail-card terms-card"><p class="service-index">14</p><h3>Governing law और disputes</h3><p>ये terms और उनसे arising किसी dispute या claim पर वही laws लागू होंगे जो applicable proposal, invoice या signed agreement में लिखे हों। यदि वहाँ jurisdiction स्पष्ट न हो, तो वही laws लागू होंगे जहाँ Sanidhya Singh सामान्यतः business carry करता है, और disputes उसी स्थान की competent courts के अधीन होंगे, जब तक दोनों पक्ष लिखित रूप में कुछ और न मान लें।</p></article>
      <article class="detail-card terms-card is-wide"><p class="service-index">15</p><h3>संपर्क</h3><p>इन terms से संबंधित project, billing, licensing या legal queries के लिए <a href="mailto:singhsanidhya13@gmail.com">singhsanidhya13@gmail.com</a> पर संपर्क करें।</p></article>
    </div>
  </section>
`;

const hindiPageTemplates = {
  "/brand-identity-systems-work": {
    metaTitle: "ब्रांड आइडेंटिटी सिस्टम्स | Sanidhya Singh",
    metaDescription:
      "लोगो, rollout assets और launch-ready visual systems पर केंद्रित brand identity work का चयन।",
    render: buildBrandIdentitySystemsHindiMarkup,
  },
  "/high-end-retouching": {
    metaTitle: "हाई-एंड रिटचिंग | Sanidhya Singh",
    metaDescription:
      "लक्ज़री cleanup, compositing और launch-ready image refinement पर केंद्रित retouching work का चयन।",
    render: buildHighEndRetouchingHindiMarkup,
  },
  "/freebies": {
    metaTitle: "फ्रीबीज़ | Sanidhya Singh",
    metaDescription:
      "Sanidhya Singh के free creative resources, downloadable assets और उपयोगी visual tools.",
    render: buildHindiFreebiesMarkup,
  },
  "/hidden": {
    metaTitle: "हिडन | Sanidhya Singh",
    metaDescription:
      "Free creative resources के लिए hidden downloads page.",
    render: buildHindiHiddenMarkup,
  },
  "/maintenance": {
    metaTitle: "मेंटेनेंस | Sanidhya Singh",
    metaDescription: "यह साइट अस्थायी रूप से maintenance पर है।",
    render: buildHindiMaintenanceMarkup,
  },
  "/404": {
    metaTitle: "404 | Sanidhya Singh",
    metaDescription: "जिस पेज को आपने खोलने की कोशिश की, वह नहीं मिला।",
    render: buildHindi404Markup,
  },
  "/terms": {
    metaTitle: "सेवाओं की शर्तें | Sanidhya Singh",
    metaDescription:
      "Sanidhya Singh की सेवाओं की शर्तें, जिनमें brand identity, campaign design, illustration, game art, motion, 3D visualization, architectural visualization और retouching शामिल हैं।",
    render: buildHindiTermsMarkup,
  },
};

const applySharedHindiChrome = () => {
  document.documentElement.lang = "hi";

  document.querySelectorAll(".brand-home-link").forEach((link) => {
    link.setAttribute("href", "/hi");
  });

  document.querySelectorAll(".site-nav .nav-link").forEach((link) => {
    const href = link.getAttribute("href") || "";

    if (href === "./" || href === "/" || href === "/hi") {
      link.textContent = "होम";
      link.setAttribute("href", "/hi");
      return;
    }

    if (href.includes("services")) {
      link.textContent = "सेवाएँ";
      link.setAttribute("href", "/hi/services");
      return;
    }

    if (href.includes("work")) {
      link.textContent = "काम";
      link.setAttribute("href", "/hi/work");
      return;
    }

    if (href.includes("freebies")) {
      link.textContent = "फ्रीबीज़";
      link.setAttribute("href", "/freebies");
      return;
    }

    if (href.includes("about")) {
      link.textContent = "परिचय";
      link.setAttribute("href", "/hi/about");
      return;
    }

    if (href.includes("contact")) {
      link.textContent = "संपर्क";
      link.setAttribute("href", "/hi/contact");
    }
  });

  const dropdownLabels = {
    "brand-identity": "ब्रांड आइडेंटिटी",
    "campaign-design": "कैंपेन डिज़ाइन",
    illustration: "इलस्ट्रेशन",
    "game-art": "गेम आर्ट",
    "motion-design": "मोशन डिज़ाइन",
    "three-d-visualization": "3D विज़ुअलाइज़ेशन",
    "architectural-visualization": "आर्किटेक्चरल विज़ुअलाइज़ेशन",
    retouching: "रिटचिंग",
  };

  document.querySelectorAll(".nav-dropdown a").forEach((link) => {
    const href = link.getAttribute("href") || "";
    const entry = Object.entries(dropdownLabels).find(([slug]) =>
      href.includes(slug)
    );

    if (!entry) {
      return;
    }

    link.textContent = entry[1];
  });

  document.querySelectorAll(".header-contact-link").forEach((link) => {
    link.textContent = "संपर्क";
    link.setAttribute("href", "/hi/contact");
  });

  document.querySelectorAll(".menu-toggle-label").forEach((label) => {
    label.textContent = "मेनू";
  });

  document.querySelectorAll(".menu-toggle").forEach((button) => {
    button.setAttribute("aria-label", "नेविगेशन मेनू खोलें");
  });

  document.querySelectorAll(".footer-text").forEach((text) => {
    text.textContent =
      "आइडेंटिटी, कैंपेन, मोशन, 3D और स्पैशियल स्टोरीटेलिंग में प्रीमियम विज़ुअल डिज़ाइन।";
  });

  document.querySelectorAll(".footer-legal-links a").forEach((link) => {
    link.textContent = "सेवाओं की शर्तें";
    link.setAttribute("href", "/terms");
  });
};

const applyHindiPageOverrides = () => {
  if (activeLocale !== "hi") {
    return;
  }

  applySharedHindiChrome();

  const metaDescription = document.querySelector('meta[name="description"]');
  const contentRoot = document.querySelector(".service-detail-content");
  const resolvedPath =
    currentLocalePath in hindiServicePages ||
    currentLocalePath in hindiWorkPages ||
    currentLocalePath in hindiPageTemplates
      ? currentLocalePath
      : document.body.classList.contains("error-page-body") &&
          document.querySelector(".error-code")?.textContent.trim() === "404"
        ? "/404"
        : currentLocalePath;
  const servicePage = hindiServicePages[resolvedPath];
  const workPage = hindiWorkPages[resolvedPath];
  const templatePage = hindiPageTemplates[resolvedPath];

  if (servicePage && contentRoot) {
    document.title = servicePage.metaTitle;
    if (metaDescription) {
      metaDescription.setAttribute("content", servicePage.metaDescription);
    }
    contentRoot.innerHTML = buildServicePageMarkup(servicePage);
    return;
  }

  if (workPage && contentRoot) {
    document.title = workPage.metaTitle;
    if (metaDescription) {
      metaDescription.setAttribute("content", workPage.metaDescription);
    }
    contentRoot.innerHTML = buildWorkPageMarkup(workPage);
    return;
  }

  if (templatePage && contentRoot) {
    document.title = templatePage.metaTitle;
    if (metaDescription) {
      metaDescription.setAttribute("content", templatePage.metaDescription);
    }
    contentRoot.innerHTML = templatePage.render();
  }
};

const getTranslation = async (locale) => {
  const normalizedLocale = locale === "hi" ? "hi" : "en";

  try {
    const response = await fetch(`/locales/${normalizedLocale}.json`, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Unable to load locale ${normalizedLocale}`);
    }

    return response.json();
  } catch (error) {
    if (normalizedLocale !== "en") {
      return getTranslation("en");
    }

    return null;
  }
};

const applyTranslations = (translations) => {
  if (!translations) {
    return;
  }

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (!key || !(key in translations)) {
      return;
    }

    element.textContent = translations[key];
  });

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.dataset.i18nHtml;

    if (!key || !(key in translations)) {
      return;
    }

    element.innerHTML = translations[key];
  });

  const titleElement = document.querySelector("title[data-i18n-title]");
  if (titleElement) {
    const key = titleElement.dataset.i18nTitle;
    if (key && key in translations) {
      document.title = translations[key];
    }
  }

  const metaDescription = document.querySelector(
    'meta[name="description"][data-i18n-meta]'
  );
  if (metaDescription) {
    const key = metaDescription.dataset.i18nMeta;
    if (key && key in translations) {
      metaDescription.setAttribute("content", translations[key]);
    }
  }
};

const initializePageTranslation = async () => {
  if (pageLocale === "hi" && !getStoredLocale()) {
    setStoredLocale("hi");
  }

  if (!document.querySelector("[data-i18n], [data-i18n-html], title[data-i18n-title]")) {
    return;
  }

  const translations = await getTranslation(activeLocale);
  applyTranslations(translations);
};

const removeLanguageSuggestion = () => {
  document.querySelector(".language-suggestion")?.remove();
};

const renderLanguageSuggestion = () => {
  if (document.querySelector(".language-suggestion")) {
    return;
  }

  const suggestion = document.createElement("aside");
  suggestion.className = "language-suggestion";
  suggestion.setAttribute("role", "dialog");
  suggestion.setAttribute("aria-live", "polite");
  suggestion.setAttribute("aria-label", "Language suggestion");

  suggestion.innerHTML = `
    <button class="language-suggestion-close" type="button" aria-label="Dismiss language suggestion">×</button>
    <p class="language-suggestion-title">Language</p>
    <p class="language-suggestion-text">We noticed you're in India 🇮🇳 — would you like to view this site in Hindi?</p>
    <div class="language-suggestion-actions">
      <button class="language-suggestion-button is-primary" type="button" data-language-choice="hi">Switch to Hindi</button>
      <button class="language-suggestion-button is-secondary" type="button" data-language-choice="en">Stay in English</button>
    </div>
  `;

  suggestion
    .querySelector('[data-language-choice="hi"]')
    ?.addEventListener("click", () => {
      setStoredLocale("hi");
      removeLanguageSuggestion();
      window.location.href = "/hi";
    });

  suggestion
    .querySelector('[data-language-choice="en"]')
    ?.addEventListener("click", () => {
      setStoredLocale("en");
      removeLanguageSuggestion();
    });

  suggestion
    .querySelector(".language-suggestion-close")
    ?.addEventListener("click", () => {
      setSuggestionDismissed();
      removeLanguageSuggestion();
    });

  document.body.append(suggestion);
};

const initializeLanguageSuggestion = async () => {
  if (activeLocale === "hi" || getStoredLocale() || getSuggestionDismissed()) {
    return;
  }

  try {
    const response = await fetch("/api/country", {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return;
    }

    const { country } = await response.json();

    if (country === "IN") {
      renderLanguageSuggestion();
    }
  } catch (error) {
    return;
  }
};

applyHindiPageOverrides();
void initializePageTranslation();
void initializeLanguageSuggestion();

const trackEvent = (eventName, payload = {}) => {
  if (!eventName) {
    return;
  }

  const eventPayload = {
    event: eventName,
    path: window.location.pathname,
    locale: activeLocale,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const body = JSON.stringify(eventPayload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const sent = navigator.sendBeacon(analyticsEndpoint, blob);

      if (sent) {
        return;
      }
    }
  } catch (error) {
    // Fall through to fetch.
  }

  void fetch(analyticsEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
    keepalive: true,
    cache: "no-store",
  }).catch(() => {});
};

const bindTrackedClick = (element, eventName, getPayload) => {
  if (!element) {
    return;
  }

  element.addEventListener("click", () => {
    trackEvent(eventName, typeof getPayload === "function" ? getPayload() : {});
  });
};

const initializeTrackedClicks = () => {
  document.querySelectorAll('[data-track="hire-me"]').forEach((element) => {
    bindTrackedClick(element, "hire_me_click", () => ({
      label: element.textContent.trim(),
      href: element.getAttribute("href") || "",
    }));
  });
};

const initializeScrollDepthTracking = () => {
  const thresholds = [25, 50, 75, 100];
  const sessionKey = `scroll-depth:${window.location.pathname}`;
  const trackedThresholds = new Set();

  try {
    const stored = JSON.parse(window.sessionStorage.getItem(sessionKey) || "[]");
    if (Array.isArray(stored)) {
      stored.forEach((value) => trackedThresholds.add(value));
    }
  } catch (error) {
    // Ignore session storage parsing issues.
  }

  let scrollFrame = 0;

  const persistThresholds = () => {
    try {
      window.sessionStorage.setItem(
        sessionKey,
        JSON.stringify(Array.from(trackedThresholds))
      );
    } catch (error) {
      return;
    }
  };

  const measureScrollDepth = () => {
    const maxScroll = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0
    );
    const progress =
      maxScroll === 0 ? 100 : Math.round((window.scrollY / maxScroll) * 100);

    thresholds.forEach((threshold) => {
      if (progress < threshold || trackedThresholds.has(threshold)) {
        return;
      }

      trackedThresholds.add(threshold);
      persistThresholds();
      trackEvent("scroll_depth", { depth: threshold });
    });
  };

  const onScroll = () => {
    window.cancelAnimationFrame(scrollFrame);
    scrollFrame = window.requestAnimationFrame(measureScrollDepth);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  measureScrollDepth();
};

const animateScrollTo = (targetY, duration = 720) => {
  if (prefersReducedMotion) {
    window.scrollTo(0, targetY);
    return;
  }

  const startY = window.scrollY;
  const delta = targetY - startY;
  const startTime = performance.now();
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const step = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);

    window.scrollTo(0, startY + delta * eased);

    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
};

const initializeSmoothScrollAnchors = () => {
  if (prefersReducedMotion) {
    return;
  }

  document.querySelectorAll('a[href*="#"]').forEach((link) => {
    let targetUrl;

    try {
      targetUrl = new URL(link.getAttribute("href"), window.location.href);
    } catch (error) {
      return;
    }

    if (
      !targetUrl.hash ||
      targetUrl.origin !== window.location.origin ||
      targetUrl.pathname !== window.location.pathname
    ) {
      return;
    }

    const targetId = decodeURIComponent(targetUrl.hash.slice(1));

    link.addEventListener("click", (event) => {
      const targetElement =
        document.getElementById(targetId) ||
        document.querySelector(targetUrl.hash);

      if (!targetElement) {
        return;
      }

      event.preventDefault();

      const headerOffset = (document.querySelector(".site-header")?.offsetHeight || 0) + 18;
      const targetY = Math.max(
        targetElement.getBoundingClientRect().top + window.scrollY - headerOffset,
        0
      );

      animateScrollTo(targetY);
      history.pushState(null, "", targetUrl.hash);
    });
  });
};

const markShellLoading = (shell) => {
  if (!shell) {
    return;
  }

  shell.classList.add("progressive-media-shell", "is-media-loading");
  shell.classList.remove("is-media-loaded");
};

const markShellLoaded = (shell) => {
  if (!shell) {
    return;
  }

  shell.classList.remove("is-media-loading");
  shell.classList.add("is-media-loaded");
};

const mediaObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.dispatchEvent(new CustomEvent("progressive:enter"));
            mediaObserver.unobserve(entry.target);
          });
        },
        {
          rootMargin: "240px 0px",
          threshold: 0.01,
        }
      )
    : null;

const observeMediaLoad = (shell, onEnter) => {
  if (!shell) {
    onEnter();
    return;
  }

  if (!mediaObserver) {
    onEnter();
    return;
  }

  const handleEnter = () => {
    shell.removeEventListener("progressive:enter", handleEnter);
    onEnter();
  };

  shell.addEventListener("progressive:enter", handleEnter);
  mediaObserver.observe(shell);
};

const preloadBackgroundShell = (shell, source) => {
  if (!shell || !source) {
    return;
  }

  markShellLoading(shell);

  const preloadImage = new Image();
  const finish = () => {
    markShellLoaded(shell);
  };

  preloadImage.addEventListener("load", finish, { once: true });
  preloadImage.addEventListener("error", finish, { once: true });
  preloadImage.src = source;

  if (preloadImage.complete) {
    finish();
  }
};

const initializeProgressiveCaseMedia = () => {
  document.querySelectorAll(".work-case-video").forEach((video) => {
    const shell = video.closest(".work-case-media");

    if (!shell) {
      return;
    }

    markShellLoading(shell);
    video.classList.add("progressive-video");
    video.preload = video.getAttribute("preload") || "metadata";

    const onReady = () => {
      video.classList.add("is-media-loaded");
      markShellLoaded(shell);
    };

    if (video.readyState >= 2) {
      onReady();
      return;
    }

    video.addEventListener("loadeddata", onReady, { once: true });
    video.addEventListener("error", onReady, { once: true });
  });

  document.querySelectorAll(".work-case-card[data-preview] .work-case-media").forEach((shell) => {
    if (shell.querySelector(".work-case-video")) {
      return;
    }

    const card = shell.closest(".work-case-card");
    const preview = card?.dataset.preview || "";
    const variant = card?.dataset.brandMedia || "";
    const source =
      backgroundMediaVariants[preview]?.[variant] || backgroundMediaSources[preview];

    preloadBackgroundShell(shell, source);
  });
};

initializeTrackedClicks();
initializeScrollDepthTracking();
initializeSmoothScrollAnchors();
initializeProgressiveCaseMedia();

const siteHeader = document.querySelector(".site-header");
const siteNav = document.querySelector(".site-nav");
const headerContact = document.querySelector(".header-contact");
const menuToggle = document.querySelector(".menu-toggle");
const mobileMenuBreakpoint = 860;

if (siteHeader && siteNav && headerContact && menuToggle) {
  siteNav.id = siteNav.id || "primary-nav";
  menuToggle.setAttribute("aria-controls", siteNav.id);

  const setMenuState = (open) => {
    siteHeader.classList.toggle("is-menu-open", open);
    document.body.classList.toggle("menu-open", open);
    menuToggle.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu"
    );
  };

  const closeMenu = () => {
    setMenuState(false);
  };

  menuToggle.addEventListener("click", () => {
    setMenuState(!siteHeader.classList.contains("is-menu-open"));
  });

  siteNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.addEventListener("click", (event) => {
    if (
      window.innerWidth > mobileMenuBreakpoint ||
      !siteHeader.classList.contains("is-menu-open") ||
      siteHeader.contains(event.target)
    ) {
      return;
    }

    closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > mobileMenuBreakpoint) {
      closeMenu();
    }
  });
}

const cards = document.querySelectorAll(".service-card");
const serviceListItems = document.querySelectorAll(".service-list-item");

document.querySelectorAll("img").forEach((image) => {
  if (!image.hasAttribute("loading")) {
    image.loading = "lazy";
  }

  if (!image.hasAttribute("decoding")) {
    image.decoding = "async";
  }
});

const revealCards = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealCards.unobserve(entry.target);
      }
    }
  },
  {
    threshold: 0.18,
  }
);

cards.forEach((card, index) => {
  card.style.transitionDelay = `${index * 70}ms`;
  revealCards.observe(card);
});

serviceListItems.forEach((item) => {
  let jiggleTimer = 0;

  item.addEventListener(
    "touchstart",
    () => {
      item.classList.remove("is-jiggling");
      void item.offsetWidth;
      item.classList.add("is-jiggling");

      window.clearTimeout(jiggleTimer);
      jiggleTimer = window.setTimeout(() => {
        item.classList.remove("is-jiggling");
      }, 380);
    },
    { passive: true }
  );
});

const compareSliders = document.querySelectorAll("[data-compare-slider]");

compareSliders.forEach((slider) => {
  const range = slider.querySelector(".work-compare-range");
  const beforeImage = slider.querySelector(".work-compare-image--before");
  const afterImage = slider.querySelector(".work-compare-image--after");
  let interactionTimer = 0;

  if (!range || !beforeImage || !afterImage) {
    return;
  }

  const setPosition = (value) => {
    slider.style.setProperty("--compare-position", `${value}%`);
  };

  const markInteracting = () => {
    slider.classList.add("is-interacting", "has-user-interacted");
    window.clearTimeout(interactionTimer);
    interactionTimer = window.setTimeout(() => {
      slider.classList.remove("is-interacting");
    }, 220);
  };

  const stopInteracting = () => {
    window.clearTimeout(interactionTimer);
    interactionTimer = window.setTimeout(() => {
      slider.classList.remove("is-interacting");
    }, 120);
  };

  markShellLoading(slider);

  [beforeImage, afterImage].forEach((image) => {
    image.classList.add("progressive-media");
    image.loading = image.getAttribute("loading") || "lazy";
    image.decoding = image.getAttribute("decoding") || "async";
  });

  let settledImages = 0;
  let startedLoading = false;

  const markImageSettled = (image) => {
    if (image.dataset.mediaSettled === "true") {
      return;
    }

    image.dataset.mediaSettled = "true";
    image.classList.add("is-media-loaded");
    settledImages += 1;

    if (settledImages >= 2) {
      markShellLoaded(slider);
    }
  };

  const loadImageWithFallback = (image) => {
    const primary = image.dataset.primary;
    const fallback = image.dataset.fallback;

    if (!primary && !fallback) {
      markImageSettled(image);
      return;
    }

    let hasTriedFallback = false;

    image.addEventListener("error", () => {
      if (!fallback || hasTriedFallback || image.src.endsWith(fallback)) {
        markImageSettled(image);
        return;
      }

      hasTriedFallback = true;
      image.src = fallback;
    });

    image.addEventListener("load", () => {
      syncAspectRatio();
      markImageSettled(image);
    });

    image.src = primary || fallback;

    if (image.complete && image.naturalWidth) {
      syncAspectRatio();
      markImageSettled(image);
    }
  };

  const syncAspectRatio = () => {
    const sourceImage = afterImage.naturalWidth ? afterImage : beforeImage;

    if (!sourceImage.naturalWidth || !sourceImage.naturalHeight) {
      return;
    }

    slider.style.setProperty(
      "--compare-aspect",
      `${sourceImage.naturalWidth} / ${sourceImage.naturalHeight}`
    );
    slider.classList.toggle(
      "is-portrait",
      sourceImage.naturalHeight > sourceImage.naturalWidth
    );
  };

  setPosition(range.value || slider.dataset.compareStart || 50);
  range.addEventListener("input", () => {
    setPosition(range.value);
    markInteracting();
  });
  range.addEventListener("pointerdown", markInteracting);
  range.addEventListener("pointerup", stopInteracting);
  range.addEventListener("pointercancel", stopInteracting);
  range.addEventListener("change", stopInteracting);
  range.addEventListener(
    "touchstart",
    () => {
      markInteracting();
    },
    { passive: true }
  );
  range.addEventListener(
    "touchend",
    () => {
      stopInteracting();
    },
    { passive: true }
  );
  range.addEventListener(
    "touchcancel",
    () => {
      stopInteracting();
    },
    { passive: true }
  );

  observeMediaLoad(slider, () => {
    if (startedLoading) {
      return;
    }

    startedLoading = true;

    [beforeImage, afterImage].forEach((image) => {
      loadImageWithFallback(image);
    });
  });
});

const offeringGrids = document.querySelectorAll(".offerings-grid");
const revealTimers = new WeakMap();

const rebalanceOfferingGrid = (grid) => {
  const mobile = window.innerWidth <= 980;
  const existingColumns = Array.from(
    grid.querySelectorAll(":scope > .offerings-column")
  );

  const sections = existingColumns.length
    ? existingColumns.flatMap((column) => Array.from(column.children))
    : Array.from(grid.querySelectorAll(":scope > .offering-group"));

  if (mobile) {
    if (existingColumns.length) {
      grid.replaceChildren(...sections);
    }
    return;
  }

  const leftColumn = document.createElement("div");
  leftColumn.className = "offerings-column";

  const rightColumn = document.createElement("div");
  rightColumn.className = "offerings-column";

  sections.forEach((section, index) => {
    if (index % 2 === 0) {
      leftColumn.appendChild(section);
    } else {
      rightColumn.appendChild(section);
    }
  });

  grid.replaceChildren(leftColumn, rightColumn);
};

const clearRevealTimers = (section) => {
  const timers = revealTimers.get(section) || [];

  timers.forEach((timer) => {
    window.clearTimeout(timer);
  });

  revealTimers.delete(section);
};

const resetSectionItems = (section) => {
  clearRevealTimers(section);

  section.querySelectorAll("li").forEach((item) => {
    item.classList.remove("is-revealed");
  });
};

const revealSectionItems = (section) => {
  resetSectionItems(section);

  const timers = [];

  section.querySelectorAll("li").forEach((item, index) => {
    const timer = window.setTimeout(() => {
      item.classList.add("is-revealed");
    }, 40 + index * 45);

    timers.push(timer);
  });

  revealTimers.set(section, timers);
};

offeringGrids.forEach((grid) => {
  rebalanceOfferingGrid(grid);

  const sections = grid.querySelectorAll(".offering-group");

  sections.forEach((section) => {
    if (section.open) {
      revealSectionItems(section);
    } else {
      resetSectionItems(section);
    }
  });

  sections.forEach((section) => {
    const summary = section.querySelector("summary");

    if (!summary) {
      return;
    }

    summary.addEventListener("click", (event) => {
      event.preventDefault();

      const willOpen = !section.open;

      sections.forEach((item) => {
        if (item !== section) {
          item.open = false;
          resetSectionItems(item);
        }
      });

      section.open = willOpen;

      if (willOpen) {
        revealSectionItems(section);
      } else {
        resetSectionItems(section);
      }
    });
  });
});

window.addEventListener("resize", () => {
  offeringGrids.forEach((grid) => {
    rebalanceOfferingGrid(grid);
  });
});

const inquiryMessageField = document.querySelector("#inquiry-message");
const inquiryServiceLabel = document.querySelector("#inquiry-service-label");
const contactEmailLink = document.querySelector("#contact-email-link");

if (inquiryMessageField && inquiryServiceLabel && contactEmailLink) {
  const localizedServiceTemplates = {
    en: {
      "brand-identity": "Brand Identity & Visual Systems",
      "campaign-design": "Campaign Design & Marketing Visuals",
      illustration: "Illustration & Visual Development",
      "game-art": "Game Art & Interactive Visual Design",
      "motion-design": "Motion Design & Animated Content",
      "three-d-visualization": "3D Design & Product Visualization",
      "architectural-visualization": "Architectural & Spatial Visualization",
      retouching: "Retouching & Image Refinement",
    },
    hi: {
      "brand-identity": "ब्रांड आइडेंटिटी और विज़ुअल सिस्टम्स",
      "campaign-design": "कैंपेन डिज़ाइन और मार्केटिंग विज़ुअल्स",
      illustration: "इलस्ट्रेशन और विज़ुअल डेवलपमेंट",
      "game-art": "गेम आर्ट और इंटरैक्टिव विज़ुअल डिज़ाइन",
      "motion-design": "मोशन डिज़ाइन और ऐनिमेटेड कंटेंट",
      "three-d-visualization": "3D डिज़ाइन और प्रोडक्ट विज़ुअलाइज़ेशन",
      "architectural-visualization": "आर्किटेक्चरल और स्पैशियल विज़ुअलाइज़ेशन",
      retouching: "रिटचिंग और इमेज रिफाइनमेंट",
    },
  };

  const contactCopy = {
    en: {
      generalInquiryLabel: "General inquiry",
      genericMessage: `Hello Sanidhya,

I would love to discuss a potential project.

Brand / project:
Scope:
Timeline:
Budget range:
References:

Please let me know the next steps.`,
      projectMessage: (serviceName) => `Hello Sanidhya,

I would love to discuss ${serviceName} for an upcoming project.

Brand / project:
Scope:
Timeline:
Budget range:
References:

Please let me know the next steps.`,
      inquirySubject: "Project Inquiry",
      serviceSubject: (serviceName) => `Inquiry - ${serviceName}`,
    },
    hi: {
      generalInquiryLabel: "सामान्य पूछताछ",
      genericMessage: `Hello Sanidhya,

मैं एक संभावित प्रोजेक्ट पर बात करना चाहता/चाहती हूँ।

ब्रांड / प्रोजेक्ट:
स्कोप:
टाइमलाइन:
बजट रेंज:
रेफरेंसेज़:

कृपया अगले steps बताइए।`,
      projectMessage: (serviceName) => `Hello Sanidhya,

मैं ${serviceName} से जुड़े एक संभावित प्रोजेक्ट पर बात करना चाहता/चाहती हूँ।

ब्रांड / प्रोजेक्ट:
स्कोप:
टाइमलाइन:
बजट रेंज:
रेफरेंसेज़:

कृपया अगले steps बताइए।`,
      inquirySubject: "प्रोजेक्ट पूछताछ",
      serviceSubject: (serviceName) => `पूछताछ - ${serviceName}`,
    },
  };

  const searchParams = new URLSearchParams(window.location.search);
  const serviceSlug = searchParams.get("service");
  const serviceTemplates = localizedServiceTemplates[activeLocale];
  const serviceName = serviceTemplates[serviceSlug];
  const copy = contactCopy[activeLocale];
  const defaultMessage = serviceName
    ? copy.projectMessage(serviceName)
    : copy.genericMessage;

  inquiryServiceLabel.textContent = serviceName || copy.generalInquiryLabel;
  inquiryMessageField.value = defaultMessage;

  const updateEmailLink = () => {
    const subject = serviceName
      ? copy.serviceSubject(serviceName)
      : copy.inquirySubject;
    const body = inquiryMessageField.value.trim() || defaultMessage;

    contactEmailLink.href = `mailto:singhsanidhya13@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  updateEmailLink();
  inquiryMessageField.addEventListener("input", updateEmailLink);
}

const freebiesForm = document.querySelector("#freebies-unlock");
const freebiesPasswordInput = document.querySelector("#freebies-password");
const freebiesStatus = document.querySelector("#freebies-status");
const freebiesAccessKey = "sanidhya-freebies-unlocked";
const hiddenPage = document.querySelector(".hidden-page-body");

if (freebiesForm && freebiesPasswordInput && freebiesStatus) {
  const unlockPassword = (freebiesForm.dataset.password || "").trim().toLowerCase();
  const freebiesCopy =
    activeLocale === "hi"
      ? {
          invalidPassword: "यह password सही नहीं है।",
          accessGranted: "एक्सेस मिल गया। Redirect हो रहा है...",
        }
      : {
          invalidPassword: "That password does not match.",
          accessGranted: "Access granted. Redirecting...",
        };

  freebiesForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const submittedPassword = freebiesPasswordInput.value.trim().toLowerCase();
    const unlocked = unlockPassword && submittedPassword === unlockPassword;

    freebiesStatus.classList.remove("is-success", "is-error");

    if (!unlocked) {
      freebiesStatus.textContent = freebiesCopy.invalidPassword;
      freebiesStatus.classList.add("is-error");
      freebiesPasswordInput.focus();
      freebiesPasswordInput.select();
      return;
    }

    window.sessionStorage.setItem(freebiesAccessKey, "true");
    freebiesStatus.textContent = freebiesCopy.accessGranted;
    freebiesStatus.classList.add("is-success");
    freebiesPasswordInput.value = "";
    window.location.href = activeLocale === "hi" ? "/hidden" : "./hidden";
  });
}

if (hiddenPage && window.sessionStorage.getItem(freebiesAccessKey) !== "true") {
  window.location.replace(activeLocale === "hi" ? "/freebies" : "./freebies");
}

const workTitleRail = document.querySelector("#work-title-rail");
const workTitleItems = Array.from(document.querySelectorAll(".work-title-item"));
const workTitleDisplay = document.querySelector("#work-title-display");
const workFeatureStack = document.querySelector("#work-feature-stack");
const workScrollHost = document.querySelector(".work-page-content");
const workShowcase = document.querySelector(".work-showcase");

if (
  workTitleRail &&
  workTitleItems.length &&
  workTitleDisplay &&
  workFeatureStack &&
  workScrollHost
) {
  const workFeatureCards = workTitleItems.map((item, index) => {
    const card = document.createElement("a");
    const label = item.textContent.trim();

    card.className = "work-feature-card";
    card.href = item.dataset.href || "./work";
    card.dataset.preview = item.dataset.preview || "";
    card.dataset.index = String(index);
    card.setAttribute("aria-label", label);
    card.innerHTML = '<div class="work-feature-media" aria-hidden="true"></div>';

    const mediaShell = card.querySelector(".work-feature-media");
    const previewSource = backgroundMediaSources[card.dataset.preview];

    preloadBackgroundShell(mediaShell, previewSource);
    bindTrackedClick(card, "project_click", () => ({
      project: label,
      preview: card.dataset.preview || "",
      href: card.getAttribute("href") || "",
    }));

    workFeatureStack.append(card);
    return card;
  });

  let activeWorkIndex = 0;
  let titleSyncLocked = false;
  let titleScrollFrame = 0;
  let workResizeFrame = 0;
  let touchStartY = null;
  let touchStartX = null;

  const setActiveWorkIndex = (index) => {
    const changed = index !== activeWorkIndex;

    if (!changed) {
      return;
    }

    activeWorkIndex = index;

    workTitleItems.forEach((entry, entryIndex) => {
      entry.classList.toggle("is-active", entryIndex === index);
    });

    workTitleDisplay.textContent = workTitleItems[index].textContent.trim();

    workFeatureCards.forEach((card, cardIndex) => {
      const stackOrder =
        (cardIndex - index + workFeatureCards.length) % workFeatureCards.length;

      let translate = 560;
      let scale = 0.52;
      let opacity = 0;

      if (stackOrder === 0) {
        translate = 0;
        scale = 1;
        opacity = 1;
      } else if (stackOrder === 1) {
        translate = 188;
        scale = 0.88;
        opacity = 0.78;
      } else if (stackOrder === 2) {
        translate = 314;
        scale = 0.76;
        opacity = 0.54;
      } else if (stackOrder === 3) {
        translate = 406;
        scale = 0.66;
        opacity = 0.3;
      }

      card.style.setProperty("--stack-order", String(stackOrder));
      card.style.setProperty("--stack-translate", `${translate}px`);
      card.style.setProperty("--stack-scale", String(scale));
      card.style.setProperty("--stack-opacity", String(opacity));
      card.classList.toggle("is-active", stackOrder === 0);
      card.tabIndex = stackOrder === 0 ? 0 : -1;
      card.setAttribute("aria-hidden", stackOrder === 0 ? "false" : "true");
    });
  };

  const nearestItemIndex = () => {
    const frameHeight =
      workTitleItems[0]?.offsetHeight || workTitleRail.clientHeight || 1;

    return Math.max(
      0,
      Math.min(
        workTitleItems.length - 1,
        Math.round(workTitleRail.scrollTop / frameHeight)
      )
    );
  };

  const scrollTitleRailToIndex = (index, behavior = "smooth") => {
    const frameHeight =
      workTitleItems[index]?.offsetHeight ||
      workTitleItems[0]?.offsetHeight ||
      workTitleRail.clientHeight ||
      1;
    const top = frameHeight * index;

    if (typeof workTitleRail.scrollTo === "function") {
      workTitleRail.scrollTo({
        top,
        behavior,
      });
      return;
    }

    workTitleRail.scrollTop = top;
  };

  const unlockTitleSync = () => {
    window.setTimeout(() => {
      titleSyncLocked = false;
    }, 260);
  };

  const activateWorkIndex = (index, source = "manual") => {
    if (index < 0 || index >= workTitleItems.length) {
      return;
    }

    setActiveWorkIndex(index);

    if (source !== "titles") {
      titleSyncLocked = true;
      scrollTitleRailToIndex(index);
      unlockTitleSync();
    }
  };

  const syncFromTitleRail = () => {
    if (titleSyncLocked) {
      return;
    }

    window.cancelAnimationFrame(titleScrollFrame);
    titleScrollFrame = window.requestAnimationFrame(() => {
      const index = nearestItemIndex();

      activateWorkIndex(index, "titles");
    });
  };

  const realignActiveWorkTitle = () => {
    window.cancelAnimationFrame(workResizeFrame);
    workResizeFrame = window.requestAnimationFrame(() => {
      const activeItem = workTitleItems[activeWorkIndex];

      if (!activeItem) {
        return;
      }

      titleSyncLocked = true;
      scrollTitleRailToIndex(activeWorkIndex, "auto");
      unlockTitleSync();
    });
  };

  const applyWorkScrollDelta = (deltaY) => {
    const nextScrollTop = workTitleRail.scrollTop + deltaY;
    const maxScrollTop = workTitleRail.scrollHeight - workTitleRail.clientHeight;
    const canScrollDown = deltaY > 0 && workTitleRail.scrollTop < maxScrollTop - 1;
    const canScrollUp = deltaY < 0 && workTitleRail.scrollTop > 1;

    if (!canScrollDown && !canScrollUp) {
      return false;
    }

    workTitleRail.scrollTop = Math.max(0, Math.min(maxScrollTop, nextScrollTop));
    return true;
  };

  activeWorkIndex = -1;
  setActiveWorkIndex(0);
  workTitleRail.addEventListener("scroll", syncFromTitleRail);
  window.addEventListener("resize", realignActiveWorkTitle);

  workScrollHost.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
        return;
      }

      if (!applyWorkScrollDelta(event.deltaY)) {
        return;
      }

      event.preventDefault();
    },
    { passive: false }
  );

  if (workShowcase) {
    workShowcase.addEventListener(
      "touchstart",
      (event) => {
        if (event.touches.length !== 1) {
          touchStartY = null;
          touchStartX = null;
          return;
        }

        touchStartY = event.touches[0].clientY;
        touchStartX = event.touches[0].clientX;
      },
      { passive: true }
    );

    workShowcase.addEventListener(
      "touchmove",
      (event) => {
        if (event.touches.length !== 1 || touchStartY === null || touchStartX === null) {
          return;
        }

        const currentY = event.touches[0].clientY;
        const currentX = event.touches[0].clientX;
        const deltaY = touchStartY - currentY;
        const deltaX = touchStartX - currentX;

        if (Math.abs(deltaY) <= Math.abs(deltaX) || Math.abs(deltaY) < 6) {
          return;
        }

        if (applyWorkScrollDelta(deltaY)) {
          event.preventDefault();
          touchStartY = currentY;
          touchStartX = currentX;
        }
      },
      { passive: false }
    );

    const resetTouchTracking = () => {
      touchStartY = null;
      touchStartX = null;
    };

    workShowcase.addEventListener("touchend", resetTouchTracking, { passive: true });
    workShowcase.addEventListener("touchcancel", resetTouchTracking, { passive: true });
  }

  workTitleItems.forEach((item, index) => {
    item.tabIndex = -1;

    item.addEventListener("click", () => {
      activateWorkIndex(index);
    });

    item.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activateWorkIndex(index);
      }
    });
  });
}
