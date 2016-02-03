BASEURL = "https://apps.rectoryschool.org/icons/"

$("document").ready(function() {
  chrome.identity.getProfileUserInfo(function (data) {
    //User info has been loaded
    
    if (data.email) {
      //We have e-mail; load the page from the server in one step
      $.getJSON(BASEURL + "json/email/", {'email': data.email}, parseIconResponse).fail(failLoadHandler);
    } else {
      //E-mail not available, check for an icon set
      chrome.storage.sync.get("iconset", function (data) {
        //Storage load complete
        if (data.iconset) {
          //We have a saved icon set
          $.getJSON(BASEURL + "json/page/" + data.iconset + "/", parseIconResponse).fail(function () {
            //In the event of an error, clear the stored icon set and get the default
            chrome.storage.sync.set({'iconset': null});
            $.getJSON(BASEURL + "json/default/", parseIconResponse).fail(failLoadHandler);
          });
        } else {
          //No saved icon set, load the default
          $.getJSON(BASEURL + "json/default/", parseIconResponse).fail(failLoadHandler);
        }
      })
    }
  });
});

function afterLoadSetup() {
	$(".dialog").dialog({
		autoOpen: false,
		show: {
			effect: "blind",
			duration: 500},
		hide: {
			effect: "fade",
			duration: 250},
		height: 700,
		width: 700,
		modal: true,
		beforeClose: dismissDialog});
		
	$("a.dialogLauncher").click(clickDialog);
	$("div[data-start-hidden]").hide();
  
  //Remove the unneeded items
  chrome.runtime.getPlatformInfo(function(data) {
    
    if (data.os != "mac" && data.os != "win") {
      $("div[data-hide-on-chromebook]").remove();
    } 
    checkURLTick();
  });
  
}

function iconToDiv(icon) {
	outerDiv = jQuery('<div/>', {
		id: icon.id,
	});
	
	outerDiv.addClass('entry');
	if (icon.checkURL) {
		outerDiv.data("checkUrl", icon.checkURL);
    outerDiv.attr("data-has-check-url", "true")
	}
  
  if (icon.mac_pc_only) {
    outerDiv.attr("data-hide-on-chromebook", "true")
    outerDiv.data("hideOnChromebook", true);
  }
  
  if (icon.startHidden) {
    outerDiv.attr("data-start-hidden", "true")
  }
  
	//Define the top section
	topDiv = $('<div/>');
	topDiv.addClass("top");
	
	//Define the link in the top
	imageLink = $('<a/>')
	imageLink.attr('href', icon.href);
	imageLink.attr('target', '_blank');
	imageLink.addClass(icon.classAttr);
	
	//A little hackey, but it's working!
	var xhr = new XMLHttpRequest();
	xhr.open('GET', icon.display_icon, true);
	xhr.responseType = 'blob';
	xhr.imageLink = imageLink
	xhr.onload = function(e) {
		img = $("<img/>");
		objURL = window.URL.createObjectURL(this.response);
		img.attr('src', objURL);
		e.target.imageLink.append(img);
	}
	
	xhr.send();

	//Add the link to the top
	topDiv.append(imageLink);
	
	//Define the bottom section
	p = $("<p/>")
	textLink = $("<a/>")
	textLink.attr('href', icon.href);
	textLink.addClass(icon.classAttr);
	textLink.text(icon.title);
	textLink.attr("target", "_blank");
	p.append(textLink);
	
	
	//Add the elements to the outer div
	outerDiv.append(topDiv);
	outerDiv.append(p);
	
	return outerDiv;
}

function parseIconResponse(data) {
	$("div#content").html("")
	
	$.each(data.icons, function(i, icon) {
		iconDiv = iconToDiv(icon);
		
		$("div#content").append(iconDiv);
	});
	
	$.each(data.folders, function(i, folder) {
		folderDiv = $("<div/>", {id: folder.uuid});
		folderDiv.addClass("dialog");
		folderDiv.attr('title', folder.title);
		
		$.each(folder.icons, function(j, icon) {
      
			iconDiv = iconToDiv(icon);
			folderDiv.append(iconDiv);
		});
		
		
		$("div#content").append(folderDiv);
	});
	
	leftP = $("<p/>", {id: 'bottomLeftLinks'});
	leftP.addClass("dialogHide");
	
	$.each(data.leftText, function(i, textLink) {
		a = $("<a/>", {id: textLink.id});
    
    if (textLink.page) {
      a.click(function(event) {
        chrome.storage.sync.set({'iconset': textLink.page});
        $.getJSON(BASEURL + "json/page/" + textLink.page + "/", parseIconResponse).fail(failLoadHandler);
        event.preventDefault();
      });
    }
    
    if (textLink.href)
      a.attr('href', textLink.href);
    else
      a.attr('href', "#");
    
		a.attr('target', '_blank');
		a.text(textLink.title);
		
		leftP.append(a);
	});
	
	rightP = $("<p/>", {id: 'bottomRightLinks'});
	rightP.addClass("dialogHide");
	
	$.each(data.rightText, function(i, textLink) {
		a = $("<a/>", {id: textLink.id});

    if (textLink.page) {
      a.click(function(event) {
        chrome.storage.sync.set({'iconset': textLink.page});
        $.getJSON(BASEURL + "json/page/" + textLink.page + "/", parseIconResponse).fail(failLoadHandler);
        event.preventDefault();
      });
    }
    
    if (textLink.href)
      a.attr('href', textLink.href);
    else
      a.attr('href', "#");
    
		a.attr('target', '_blank');
		a.text(textLink.title);
		
		rightP.append(a);
	});
	
	$("div#content").append(leftP);
	$("div#content").append(rightP);
	
	afterLoadSetup();
}

function failLoadHandler() {
  $("div#content").html("There was an error loading the paw. Please contact Technology");
}

function clickDialog(e) {
	toShow = $(e.currentTarget).attr("href")
	
	var count = $(toShow).find(".entry").length

  $(toShow).dialog({height: $(window).height() - 50})
  $(toShow).dialog({width: $(window).width() - 50})
  
	$(toShow).dialog("open");

	$(".dialogHide").hide();
	
	return false;
}

function dismissDialog(e, ui) {
	$(".dialogHide").show();
}

function checkURLTick() {
  checkAllURLs();
  
  setTimeout(checkURLTick, 10000);
}

function checkAllURLs() {
  urls = getCheckURLs();
  
  $(urls).each(function(i, url) { checkURL(url); });
}

function getCheckURLs() {
  return $.unique(
    $("div[data-has-check-url]").map(function() {
      return $(this).data("checkUrl")
    })
  )
}

function checkURL(url) {
  var request = $.ajax({
    url: url,
    type: "GET",
    dataType: "text"
  });
  
  request.success(function() {
    setCheckURLShow(url, true);
  });
  
  request.fail(function() {
    setCheckURLShow(url, false);
  });
}

function setCheckURLShow(url, show) {
  $("div[data-has-check-url]").each(function(i, obj) {
    obj = $(obj);
    
    objURL = obj.data("checkUrl");
    if (objURL == url) {
      if (show) { obj.show(); }
      else { obj.hide(); }
    }
  })
}