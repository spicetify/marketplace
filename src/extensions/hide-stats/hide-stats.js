(function HideStats() {
  async function main() {
    while (!Spicetify?.Player) {
      await new Promise(r => setTimeout(r, 100));
    }

    const style = document.createElement("style");
    style.setAttribute("data-hide-stats", "true");
    style.textContent = `
      .main-entityHeader-detailsText {
        display: none !important;
      }
      .main-trackList-rowPlayCount {
        display: none !important;
      }
      .artist-artistAbout-statsContainer {
        display: none !important;
      }
      .artist-artistAbout-content > .encore-text-body-medium-bold {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  main();
})();
