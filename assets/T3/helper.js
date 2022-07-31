export class SecondaryBox
{
  constructor(defaultText) {
    this.box = document.createElement('div');
    this.box.id = "box";
    this.box.style.padding = "6px 14px";
    this.box.style.bottom = "0";
    this.box.style.left= "0";
    this.box.style.position = "fixed";
    this.box.style.backgroundColor = "rgba(100,100,255,0.5)";
    this.box.style.color = "white";
    this.box.style.fontFamily = "sans-serif";
    this.box.style.fontSize = "26px";

    this.textnode = document.createTextNode(defaultText);
    this.box.appendChild(this.textnode);
    document.body.appendChild(this.box);
  }
  changeMessage(newText) {
    this.textnode.nodeValue = newText;
  }
}

export class Buttons 
{    
    constructor(onButtonDown, onButtonUp)
    {
        this.buttons = document.getElementsByTagName("button");
 
        // Add listeners
        for (let i = 0; i < this.buttons.length; i++) 
        {
            // this.buttons[i].addEventListener("mousedown", onButtonDown, false);
            this.buttons[i].addEventListener("touchstart", onButtonDown, false);
            // this.buttons[i].addEventListener("mouseup", onButtonUp, false);
            this.buttons[i].addEventListener("touchend", onButtonUp, false);
         }  
        return this;
    };

    setFullScreen()
    {
        if (!document.fullscreenElement && !document.mozFullScreenElement && 
            !document.webkitFullscreenElement && !document.msFullscreenElement ) {
            if (document.documentElement.webkitRequestFullscreen) {
                document.documentElement.webkitRequestFullscreen();                            
                //document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);            
            } else if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen();
            } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
            } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
            }
        } else {
            if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
            }else if (document.exitFullscreen) {
            document.exitFullscreen();
            } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
            } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
            } 
        }      
    }
};