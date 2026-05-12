self.addEventListener("install", () => {
    console.log("SW installed");
  });
  
  self.addEventListener("fetch", () => {
    // optional cache later
  });