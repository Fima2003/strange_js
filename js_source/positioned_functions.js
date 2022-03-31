var header = document.getElementById("header");
var donateBtn = document.getElementById("donate");
var shareBtn = document.getElementById("share");
var pressed = 0;
var visible = true;

document.addEventListener('mousemove', (event) => {
  // console.log(event.clientX, event.clientY);
  onMove(event.clientX, event.clientY);
});

donateBtn.addEventListener('click', () => {
  window.open("https://www.google.com");
});

shareBtn.addEventListener('click', () => {
  window.open("https://www.google.com");
});

function show(){
  $(".appbar").css({opacity: 0, visibility: "visible"}).animate({opacity: 1.0}, 200);
  header.toggleAttribute("m-fadeOut");
  // donateBtn.animate({opacity: 0}, 200)
  // header.animate({opacity: 0}, 200)
}

function hide(){
  $(".appbar").css({opacity: 1, visibility: "visible"}).animate({opacity: 0.0}, 200);
  // header.animate({opacity: 0}, 200);
}

function onMove(X, Y){
  if (Y < header.clientHeight){
    if(visible === false){
      show();
      visible = true;
      console.log(visible);
    }
    if(donateBtn.offsetLeft < X  && X < donateBtn.offsetLeft + donateBtn.offsetWidth){
      if(pressed === 200) {
        pressed = 0;
        donateBtn.click();
      }else{
        pressed+=1;
      }
    }
    else if (shareBtn.offsetLeft < X && X < shareBtn.offsetLeft + shareBtn.offsetWidth){
      if(pressed === 100) {
        pressed = 0;
        shareBtn.click();
      }else{
        pressed+=1;
      }
    }else{
      pressed = 0;
    }
  }else{
    if(visible === true){
      console.log(visible);
      hide();
      visible = false;
      console.log(visible);
    }
  }
}
