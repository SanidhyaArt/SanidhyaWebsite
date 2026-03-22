# Website Building Guide for Your Portfolio

This guide explains the technical terms, concepts, and decisions used while building your website. It is written around your actual project, not a generic tutorial.

## 1. What Kind of Website You Have

Your site is a **static multi-page website**.

That means:
- Each page is a real HTML file.
- There is no database.
- There is no backend server generating pages on demand.
- The browser loads HTML, CSS, JavaScript, images, and videos directly.

In your project, the main files are:
- `index.html` - homepage
- `services.html`, `work.html`, `about.html`, `contact.html` - main pages
- individual service pages like `brand-identity.html`
- individual work pages like `product-renders.html`
- `styles.css` - all visual styling
- `script.js` - interactivity
- `vercel.json` - deployment behavior for Vercel
- `assets/` - images, videos, icons
- `downloads/` - downloadable files

This style of website is ideal for portfolios because it is:
- fast
- inexpensive to host
- easy to version on GitHub
- simple to deploy on Vercel

## 2. The Core Technologies Used

### HTML

**HTML** stands for HyperText Markup Language.

It defines the structure of a page:
- headings
- paragraphs
- links
- buttons
- images
- sections
- forms

Think of HTML as the **content skeleton** of the website.

### CSS

**CSS** stands for Cascading Style Sheets.

It controls the presentation:
- colors
- fonts
- spacing
- layout
- hover effects
- animations
- responsive behavior

Think of CSS as the **visual system** of the website.

### JavaScript

**JavaScript** adds behavior and logic.

In your site it controls things like:
- the mobile menu
- service accordions
- staged reveals
- the work showcase behavior
- prefilled contact messages
- the freebies password flow

Think of JavaScript as the **interaction layer**.

### JSON

**JSON** stands for JavaScript Object Notation.

Your `vercel.json` file is a configuration file. It tells Vercel how to treat the site during deployment. In your case, it enables clean URLs.

## 3. Your File and Folder Structure

A clean project structure matters because hosting platforms and browsers depend on file paths being correct.

Your current structure is:

```text
Codex/
  index.html
  services.html
  work.html
  about.html
  contact.html
  freebies.html
  hidden.html
  404.html
  maintenance.html
  brand-identity.html
  campaign-design.html
  illustration.html
  game-art.html
  motion-design.html
  three-d-visualization.html
  architectural-visualization.html
  retouching.html
  product-renders.html
  explainer-videos.html
  brand-identity-systems-work.html
  campaign-visuals.html
  editorial-illustration.html
  game-ui-icons.html
  arch-viz-work.html
  high-end-retouching.html
  styles.css
  script.js
  vercel.json
  assets/
    images/
    videos/
    icons/
  downloads/
```

Why this is good:
- all public pages live at the root
- shared CSS and JS are easy to reference with `./styles.css` and `./script.js`
- media files are organized inside `assets/`
- deployment platforms can find `index.html` immediately

## 4. HTML Terms Used in Your Site

### `<!DOCTYPE html>`

This tells the browser to use modern HTML rules.

### `<html>`, `<head>`, `<body>`

- `<html>` wraps the whole page
- `<head>` contains metadata and references to styles/scripts
- `<body>` contains what the user sees

### `<meta charset="UTF-8">`

This sets the character encoding so text displays correctly.

### `<meta name="viewport" content="width=device-width, initial-scale=1.0">`

This is critical for responsive design. It tells phones to size the page to the device width instead of pretending to be a desktop screen.

### `<title>`

This is the browser tab title and also affects SEO and link previews.

### `<meta name="description">`

This helps search engines and social previews understand the page.

### `<link rel="stylesheet" href="./styles.css">`

This connects the HTML page to the CSS file.

### `<script src="./script.js"></script>`

This loads your JavaScript file.

### Semantic HTML

Your site uses semantic elements like:
- `<header>`
- `<nav>`
- `<main>`
- `<section>`
- `<article>`
- `<footer>`

These elements describe meaning, not just appearance. They help with accessibility, maintainability, and SEO.

### Anchors and links

`<a href="./services">Services</a>`

This creates a link. The `href` is the destination.

### Classes and IDs

Examples:
- `class="site-header"`
- `id="primary-nav"`

Classes are reusable labels for styling and scripting.
IDs are unique identifiers for a specific element.

### ARIA attributes

Examples:
- `aria-label`
- `aria-expanded`
- `aria-controls`
- `aria-hidden`

These improve accessibility by telling assistive technologies what the element is doing.

### Video backgrounds

Your site uses:

```html
<video autoplay muted loop playsinline>
```

Important terms:
- `autoplay` - starts automatically
- `muted` - required by many browsers for autoplay
- `loop` - repeats continuously
- `playsinline` - avoids forcing fullscreen on mobile

### Forms and inputs

The freebies page and contact page use inputs and form behavior. Forms collect user input; JavaScript then handles what happens with that data.

## 5. CSS Terms and Concepts Used

### CSS custom properties

At the top of `styles.css`, you defined variables in `:root`, such as:
- `--bg`
- `--text`
- `--accent`
- `--radius-xl`
- `--font-main`

These are called **CSS custom properties** or **CSS variables**.

Why they matter:
- one place to manage colors and fonts
- easier consistency across the site
- easier rebranding later

### Selectors

Selectors tell CSS what to style.

Examples:
- `body`
- `.site-header`
- `.header-contact-link:hover`
- `.menu-toggle.is-open`
- `.work-feature-card[data-preview="retouching"]`

Different kinds used in your site:
- element selectors
- class selectors
- attribute selectors
- pseudo-classes like `:hover`
- pseudo-elements like `::before` and `::after`

### Box model

Every element is basically:
- content
- padding
- border
- margin

You use:

```css
*,
*::before,
*::after {
  box-sizing: border-box;
}
```

This makes width calculations more predictable.

### Flexbox

Flexbox is used for one-dimensional layout, like rows or columns.

Good for:
- aligning buttons
- centering groups
- header actions
- social links

### Grid

CSS Grid is used for two-dimensional layout.

Good for:
- page sections
- header structure
- cards in rows and columns
- balancing layouts across desktop

Your header uses grid to hold:
- left brand
- centered nav
- right contact/menu area

### `max-width` and centered containers

You use controlled widths so the content does not stretch too wide on desktop. This keeps the design readable and premium-looking.

### `margin: auto`

This is a common way to center block content horizontally.

### Positioning

Important types used in your site:

- `static` - default
- `relative` - positioned relative to itself
- `absolute` - positioned relative to a positioned ancestor
- `fixed` - pinned to the viewport
- `sticky` - behaves normally, then sticks once it reaches an edge

Examples in your site:
- sticky header
- fixed overlays
- absolute menu/button positioning

### `z-index`

This controls stacking order when elements overlap.

You used it to ensure:
- the header stays above content
- the mobile menu stays above service content
- overlays layer correctly

### Background layers

Your site uses layered backgrounds:
- gradients
- overlays
- videos
- image backgrounds

This is why many background declarations in your CSS have multiple comma-separated layers.

### `transform`

Transforms visually move or scale elements without changing normal document flow.

Used in your site for:
- hover lifts
- scaling cards
- icon rotation
- menu animation
- stacked work cards

Common functions:
- `translateY()`
- `translateX()`
- `scale()`
- `rotate()`

### `transition`

Transitions animate changes between states.

You used them for:
- button hover motion
- dropdown/menu animation
- card movement
- icon changes
- subtle polish on interactions

### Keyframes animation

Your site also uses keyframe-based animation for effects like jiggle motion. This is useful when the motion is more custom than a simple state change.

### Border radius

This creates rounded corners. Your site uses it heavily to create the polished soft-card style.

### Box shadow

This creates depth and separation between layers.

### Opacity

Controls transparency. Useful for overlays, cards, and layered visual hierarchy.

### Media queries

You use breakpoints like:
- `@media (max-width: 980px)`
- `@media (max-width: 860px)`
- `@media (max-width: 720px)`

These tell the CSS to change layout for smaller screens.

This is the foundation of **responsive design**.

### `prefers-reduced-motion`

You included a reduced-motion media query. This is an accessibility feature that reduces animation for people who prefer less motion.

### `scrollbar-gutter`

This helps prevent layout shifting when scrollbars appear or disappear.

## 6. Responsive Design

Responsive design means the site adapts to different screen sizes.

In your site, that included:
- collapsing the desktop nav into a mobile menu
- turning the contact area into a `Menu` button on smaller screens
- changing grids into stacked layouts
- adjusting spacing and heading placement for mobile
- ensuring the menu stays above open service sections

The mental model:
- desktop and mobile are not just smaller and larger versions of the same layout
- they often need different interaction patterns

## 7. JavaScript Terms Used in Your Site

### DOM

The **DOM** is the Document Object Model. It is the browser's in-memory representation of the page.

JavaScript uses the DOM to:
- find elements
- change text
- add classes
- respond to clicks
- build UI behavior

### `querySelector` and `querySelectorAll`

These find elements in the DOM.

Examples:
- `.site-header`
- `.menu-toggle`
- `.brand-name`

### `addEventListener`

This listens for user actions.

Your site uses events like:
- `click`
- `keydown`
- `resize`
- `scroll`
- `submit`
- `input`

### Toggling classes

Instead of hardcoding styles in JavaScript, you often add or remove classes and let CSS do the visual work.

This is a strong pattern because it keeps behavior and presentation loosely separated.

### `preventDefault()`

Stops the browser's default action.

You use this when custom behavior should happen instead of the browser's normal behavior, such as custom accordion handling.

### `IntersectionObserver`

This watches whether elements are entering the viewport.

You use it for reveal animations, so cards animate when they come into view rather than all at once.

### `setTimeout()`

This delays code execution.

You use it for staggered reveals so sub-services appear one by one.

### `URLSearchParams`

This reads query parameters from the URL.

Example:
- `/contact?service=brand-identity`

This lets the contact page know which service the visitor came from.

### `mailto:`

Your contact button builds a `mailto:` link dynamically so clicking it opens the user's email app with a subject and body already filled in.

### `sessionStorage`

This stores temporary browser data for the current tab/session.

You use it for the freebies flow:
- correct password entered
- access granted in that session
- hidden page allowed only during that session

### `dataset`

`data-*` attributes let HTML store small pieces of custom data that JavaScript can read.

This is useful for work cards and service-specific behaviors.

### Rebalancing content with JavaScript

Your site also uses JavaScript to:
- rebalance service offerings into columns on desktop
- collapse them into one stream on mobile
- synchronize the work title display and work preview stack

This is a good example of JavaScript helping layout behavior when pure CSS would be awkward.

## 8. Accessibility Concepts Used

Accessibility means making the site usable by more people, including keyboard users and assistive technology users.

Things used in your site:
- semantic HTML
- ARIA attributes
- focus-visible styling
- reduced motion support
- labels for menu controls
- hidden helper text via `.sr-only`

This matters because a site is not only a visual artifact. It is also an interface.

## 9. Paths, URLs, and Linking

### Relative paths

Examples:
- `./styles.css`
- `./script.js`
- `./assets/videos/site-background.mp4`

Relative paths depend on where the current HTML file lives.

When your pages were inside an `html/` folder, paths had to use `../`.
When we moved the pages back to the repo root, they changed back to `./`.

### Root entry point

Most static hosts expect a root `index.html`.

That was the reason your Vercel deployment initially failed with a not-found error after the pages were moved into a subfolder.

### Clean URLs

A clean URL looks like:
- `/services`

instead of:
- `/services.html`

Your `vercel.json` now enables:

```json
{
  "cleanUrls": true
}
```

That tells Vercel to serve `.html` files without exposing the `.html` extension in the public URL.

## 10. Vercel, Hosting, and Deployment

### Hosting

Hosting means the site files are stored on a server and delivered to browsers over the internet.

### Deployment

Deployment means publishing the current version of the site to hosting.

### Vercel

Vercel is the platform serving your site.

It:
- reads the repo
- deploys the files
- gives you a live URL
- can connect a custom domain

### 404 page

`404.html` is the page shown when a route does not exist.

### Maintenance page

`maintenance.html` is a temporary page you can use if the main site should be hidden while updates happen.

### Why the earlier Vercel error happened

What the code was doing:
- putting all pages inside an `html/` subfolder

What Vercel needed:
- a root `index.html`
- or explicit routing config

What fixed it:
- moving pages back to the root
- enabling `cleanUrls` for extensionless URLs

## 11. Git and GitHub Terms You Encountered

### Repository (repo)

A repo is the project tracked by Git.

### Git

Git tracks file history.

### GitHub

GitHub stores the repo online.

### `git add`

Stages changes for the next commit.

### `git commit`

Saves a snapshot of the staged changes.

### `git push`

Uploads local commits to GitHub.

### `origin`

The default name for the remote GitHub repository.

### `main`

The main branch of the project.

### Upstream branch

The remote branch your local branch pushes to by default.

### `403`

This means authentication succeeded enough for GitHub to respond, but the current credential was not allowed to write to the repo.

## 12. Interaction Patterns You Now Have in This Site

These are the major behaviors built into your portfolio:

- hover states for buttons and cards
- dropdown services menu
- mobile hamburger menu that becomes an X
- responsive navigation
- click-to-expand service sections
- staggered sub-service reveal
- work showcase controlled by scrolling
- prefilled service inquiries on the contact page
- password-gated freebies access
- session-based hidden downloads page

These are all examples of **front-end interaction design**, meaning behavior implemented entirely in the browser.

## 13. Common Mistakes to Watch For

### Wrong file paths

Symptoms:
- missing CSS
- missing JS
- video not loading
- images broken

Common cause:
- page moved to a different folder but links not updated

### Forgetting assets in GitHub

Symptoms:
- works locally, not online

Common cause:
- local files exist on your machine but were never uploaded

### Host expects `index.html`

Symptoms:
- deployment succeeds but site shows not found

Common cause:
- homepage is not where the host expects it

### Mixed URL styles

Symptoms:
- some links use `/services`
- others use `/services.html`

This creates inconsistency and can break navigation depending on host behavior.

### Caching

Symptoms:
- you changed the site but still see the old version

Common fix:
- hard refresh

### Overlapping layers

Symptoms:
- menu disappears behind content
- header feels broken on mobile

Common cause:
- `z-index`, `position`, or stacking context issues

## 14. The Correct Mental Model for Maintaining This Site

Think of the site as four layers:

1. Structure
- HTML files define what exists.

2. Styling
- `styles.css` defines how it looks.

3. Behavior
- `script.js` defines how it responds.

4. Delivery
- GitHub and Vercel define how it gets online.

When something breaks, ask:
- Is the content wrong? Check HTML.
- Is the appearance wrong? Check CSS.
- Is the interaction wrong? Check JavaScript.
- Is the live site wrong but local is right? Check GitHub/Vercel/deployment.

## 15. How to Edit This Site Safely

### To change text

Edit the relevant HTML page.

### To change colors, spacing, fonts, or layout

Edit `styles.css`.

### To change interactivity

Edit `script.js`.

### To change images or videos

Put new files in:
- `assets/images/`
- `assets/videos/`

Then update the file paths in HTML or CSS.

### To add a new page

1. Duplicate a similar HTML file.
2. Rename it.
3. Update its title, meta description, and content.
4. Add links to it from navigation or related sections.
5. Push the changes to GitHub.
6. Let Vercel redeploy.

## 16. Quick Glossary

- Accessibility: making the site usable for more people
- Anchor: a link element
- Asset: an image, video, icon, or similar file
- Breakpoint: screen width where layout changes
- Clean URL: URL without `.html`
- CSS variable: reusable value like `--accent`
- Deployment: publishing the site online
- DOM: browser representation of the page
- Flexbox: one-dimensional layout system
- Grid: two-dimensional layout system
- Hover state: visual change when the pointer is over something
- Media query: CSS rule for different screen sizes
- Query parameter: URL data like `?service=brand-identity`
- Relative path: path based on current file location
- Responsive design: layout adapting to different screens
- Semantic HTML: HTML that describes meaning
- Session storage: browser storage for one session
- Static site: site served as files, not generated by a backend
- Transition: animation between states
- Transform: visual movement/scaling/rotation
- Viewport: the visible browser area
- z-index: stack order of overlapping elements

## 17. Final Advice

You do not need to memorize everything at once.

A strong practical workflow is:
- understand which file controls what
- change one thing at a time
- preview the result
- commit and push only when the change is clear

For this specific project, the most important files to stay comfortable with are:
- `index.html`
- `services.html`
- `work.html`
- `contact.html`
- `styles.css`
- `script.js`
- `vercel.json`

Once these become familiar, the rest of the site becomes much easier to manage.
