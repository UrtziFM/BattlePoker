/*done with game below is navigation*/


function choosePoker(option) {

    let balance = 500;
    let setTheme = "united";
    if (localStorage.getItem("theme")) {
        setTheme = localStorage.getItem("theme");
    }
    if (localStorage.getItem("balance")) {
        balance = localStorage.getItem("balance");
    }
    if (option === "texas-holdem") {
        window.location.href = "https://aaronrs2002.github.io/texas-holdem/?" + gaParam + "&theme=" + setTheme + "&balance=" + balance + "&";
    } else {
        window.location.href = "https://aaronrs2002.github.io/poker/?" + gaParam + "&theme=" + setTheme + "&balance=" + balance + "&";
    }
}

function openGame(gameId) {
    // Map the gameId to the actual game page URLs
    var gamePages = {
      'trilogy': '../Main.html'
    };
  
    // Get the URL for the selected game
    var gameUrl = gamePages[gameId];
  
    if (gameUrl) {
      // Check if the game page exists (optional)
      // This requires an additional request, which can be complex due to cross-origin policies
      // For simplicity, we'll proceed to navigate
  
      // Navigate to the game page
      window.location.href = gameUrl;
    } else {
      // Display an alert to the user
      alert('Sorry, the selected game is not available.');
    }
  }