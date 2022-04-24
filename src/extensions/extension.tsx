(async () => {
  while (!Spicetify?.showNotification) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Show message on start.
  Spicetify.showNotification("Welcome!");
})()
