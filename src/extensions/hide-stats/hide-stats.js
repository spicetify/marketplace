console.log("hide-stats.js loaded!");

(function HideStats() {
  async function main() {
    while (!Spicetify?.Player) {
      await new Promise(r => setTimeout(r, 100));
    }

    console.log("Spicetify ready, injecting styles...");

    const style = document.createElement("style");
    style.textContent = `
      .main-entityHeader-detailsText {
        display: none !important;
      }
      .main-trackList-rowPlayCount {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    console.log("Styles injected!");
  }

  main();
})();