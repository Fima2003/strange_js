var donateBtn = document.getElementById("donate");
var shareBtn = document.getElementById("share");
var nextBtn = document.getElementById("next");

donateBtn.addEventListener('click', () => {
  window.open("https://www.google.com");
});

shareBtn.addEventListener('click', () => {
  window.open("https://www.google.com");
});

nextBtn.addEventListener('click', () => {
  location.reload();
});