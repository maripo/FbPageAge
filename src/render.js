var pageMap = [];

function clear ()
{
	var yearColumn = document.getElementById('yearBar');
	var columnLeft = document.getElementById('timelineLeft');
	var columnRight = document.getElementById('timelineRight');
	var pointers = document.getElementById('pointers');
	yearColumn.innerHTML = '';
	columnLeft.innerHTML = '';
	columnRight.innerHTML = '';
	pointers.innerHTML = '';
	yearColumn.style.height = '0px';
	document.getElementById("shareButton").style.display = 'none';
}

function render (user)
{
	var timeline = new Timeline();
	var milestones = [];
	createPageMap();
	//API data to wrapper
	for (var i in fqlMilestones.data) 
		milestones.push(new Milestone(fqlMilestones.data[i]));
	
	var birthday = new MyBirthday(user);
	var myEvents = createMyEvents(birthday);
	var keyYears = [];
	
	//Birth year
	if (birthday.date)
		keyYears[birthday.getYear()] = true;
	//Now
	if (myEvents.length>0)
		keyYears[myEvents[myEvents.length-1].getYear()] = true;
	
	for (var i=0; i<milestones.length; i++)
	{
		var milestone = milestones[i];
		//Check foundation event
		var page = pageMap[milestone.data.owner_id];
		if (!page.foundationYearFound)
		if (page)
		{
			milestone.isFoundationEvent = true; 
			page.foundedYearFound = true;
		}
		for (var age=1; age<myEvents.length-1; age++)
		{
			if (myEvents[age-1].getTime() < milestone.getTime() && milestone.getTime() < myEvents[age+1].getTime())
			{
				myEvents[age].hasEvent = true;
				keyYears[myEvents[age].getYear()] = true;
			}
		}
		var year = milestone.startDate.getFullYear();
		keyYears[year] = true;
	}
	if (birthday.date)
		milestones.push(birthday);
	for (var i in myEvents)
	{ 
		var event = myEvents[i];
		if (i==0 || i==myEvents.length-1 || event.hasEvent)
			milestones.push(event);
	}
	for (var year in keyYears)
	{
		milestones.push(new KeyYear(year));
	}
	milestones.sort(
		function(a,b){return (a.getTime() > b.getTime()) ? 1: -1 });
	for (var i=0; i<milestones.length; i++)
	{
		timeline.addMilestone(milestones[i]);
	}
	document.getElementById('loadingLayer').style.display = "none";
	document.getElementById('yearBar').style.height = (timeline.getTotalHeight() + 60) + "px";
	document.getElementById("timelineContainer").style.height = (timeline.getTotalHeight() + 60) + "px";
	document.getElementById('introduction').style.display = "none";
	document.getElementById('timelineContainer').style.visibility = "visible";
	document.getElementById('timelineWrapper').scrollTop = timeline.defaultScrollTop;
	resizeBody();
	if (user.isMe)
	{
		document.getElementById("shareButton").style.display = 'block';
	}
}
function createPageMap ()
{
	for (var i=0; i<pages.data.length; i++)
	{
		var page = pages.data[i];
		pageMap[page.page_id] = page;
	}
}

function createMyEvents (birthday)
{
	if (!birthday.date) return [];
	var list = [];
	var now = new Date();
	var date = (birthday.date)?new Date(birthday.date.getYear(),birthday.date.getMonth(),birthday.date.getDate()):null;
	var age = 0;
	while (date.getTime() < now.getTime())
	{
		list.push(new Age(date, age));
		age ++;
		date = new Date(date.getFullYear()+1, date.getMonth(), date.getDate())
	}
	return list;
}

var Age = function (date, age)
{
	this.date = date;
	this.age = age;
}
Age.prototype.getYear = function ()
{
	return this.date.getFullYear();
}
Age.prototype.getBox = function ()
{
	if (this.box) return this.box;
	this.box = document.createElement("DIV");
	
	var milestone = this;
	var numBox = document.createElement('DIV');
	numBox.className = 'num';
	var suffixBox = document.createElement('DIV');
	suffixBox.className = 'suffix';
	this.box.className = "ageBox";
	numBox.innerHTML = this.age;
	suffixBox.innerHTML = 'YEARS OLD';
	this.box.appendChild(numBox);
	this.box.appendChild(suffixBox);
	return this.box;

};
Age.prototype.getType = function ()
{
	return TYPE_AGE;
}
Age.prototype.getTime = function ()
{
	return this.date.getTime();
};
/**
 * My Birthday
 */
 var REGEX_MY_BIRTHDAY = new RegExp("(\\d{2})/(\\d{2})/(\\d{4})");
 
 var MyBirthday = function (user)
{
	this.user = user;
	this.birthString = user.data.birthday_date;
	this.name = user.data.name;
	this.iconUrl = user.data.pic_small;
	this.date = null;
	if (this.birthString && this.birthString.match(REGEX_MY_BIRTHDAY))
	{
		this.date = new Date(this.birthString);
		this.date.setHours(1);
	}
}
MyBirthday.prototype.getYear = function ()
{
	return this.date.getFullYear();
}
MyBirthday.prototype.getBox = function ()
{
	if (this.box) return this.box;
	this.box = document.createElement("DIV");
	this.box.className = 'item foundation birthday';
	
	var dateBox = document.createElement("DIV");
	dateBox.innerHTML = formatDate(this.date);
	dateBox.className = 'date';
	var icon = document.createElement("DIV");
	icon.className = 'icon'
	icon.style.backgroundImage = 'url(' + this.iconUrl + ')';
	var h2 = document.createElement('H2');
	h2.innerHTML = this.name + ' was born'
	
	this.box.appendChild(icon)
	this.box.appendChild(dateBox);
	this.box.appendChild(h2);
	return this.box;
};
MyBirthday.prototype.getType = function ()
{
	return TYPE_MILESTONE;
}

MyBirthday.prototype.getTime = function ()
{
	return (this.date)? this.date.getTime() : 0;
};

/**
 * Key year
 */
var KeyYear = function (year)
{
	this.date = new Date(year, 0, 1);
}
KeyYear.prototype.getBox = function ()
{
	if (this.box) return this.box;
	this.box = document.createElement("DIV");
	this.box.className = 'yearBox';
	this.box.innerHTML = this.date.getFullYear();
	return this.box;

};
KeyYear.prototype.getType = function ()
{
	return TYPE_YEAR;
}
KeyYear.prototype.getTime = function ()
{
	return  this.date.getTime();
};

var TYPE_MILESTONE = 1;
var TYPE_AGE = 2;
var TYPE_YEAR = 3;
var TYPE_BIRTH = 4;

var Milestone = function (data)
{
	this.data = data;
	this.startDate = new Date(parseInt(data.start_time)*1000);
}
Milestone.prototype.getTime = function ()
{
	return (this.startDate)? this.startDate.getTime() : 0;
};
Milestone.prototype.getType = function()
{
	return TYPE_MILESTONE;
}
Milestone.prototype.getBox = function ()
{
	var milestone = this;
	var page = pageMap[milestone.data.owner_id];
	
	if (this.box) return this.box;
	this.box = document.createElement("DIV");
	this.box.className = 'item';
	
	var dateBox = document.createElement("DIV");
	dateBox.innerHTML = formatDate(milestone.startDate);
	dateBox.className = 'date';
	var pageBox = document.createElement("DIV");
	pageBox.className = 'page';
	var pageLink = document.createElement("A");
	pageLink.target = '_blank';
	pageLink.href = "http://www.facebook.com/" + page.page_id;
	pageLink.innerHTML = page.name;
	pageBox.appendChild(pageLink);
	var icon = document.createElement("DIV");
	icon.className = 'icon'
	icon.style.backgroundImage = 'url(' + page.pic_small + ')';
	var h2 = document.createElement('H2');
	var h2Link = document.createElement('A');
	h2Link.target = '_blank';
	if (milestone.isFoundationEvent && !milestone.data.title)
	{
		h2Link.innerHTML = Milestone.getFoundationMessage(page);
		this.box.className = 'item foundation';
	}
	else
		h2Link.innerHTML = milestone.data.title;
	h2Link.href = "http://www.facebook.com/" + this.data.id;
	h2.appendChild(h2Link);
	
	this.box.appendChild(icon)
	this.box.appendChild(dateBox);
	this.box.appendChild(pageBox);
	this.box.appendChild(h2);
	if (this.data.description)
	{
		var descriptionBox = document.createElement("DIV");
		descriptionBox.className = 'description';
		descriptionBox.innerHTML = formatDescription(this.data.description);
		this.box.appendChild(descriptionBox);
	}
	
	return this.box;
};
Milestone.getFoundationMessage = function (page)
{
	switch (page.type) 
	{
		case "PUBLIC FIGURE": return page.name + " was born";
		case "PRODUCT/SERVICE": return page.name + " was released";
		case "GAMES/TOYS": return page.name + " was released";
		case "COMMUNITY": return page.name + " started";
		case "LOCAL BUSINESS": return page.name + " opened";
		case "APP PAGE": return page.name + " was released";
		case "MUSICIAN/BAND": return page.name + " started";
		default: return page.name + " was founded"
	}
}
var LINK_REGEX = new RegExp("(http(|s):\\/\\/[A-Za-z0-9_\\=\\&\\%\\?\\/\\-\\.]+)","g");
var RET_REGEX = new RegExp("\\n+","g");
// Markup
function formatDescription (str) {
	return str.replace(LINK_REGEX, 
		function(all, part){return '<a href="'+part+'" target="_blank">' + shortenUrl(part) + '</a>'}).replace(RET_REGEX, '<br/>');
}
var MAX_URL_CHARS = 28;
function shortenUrl (url)
{
	return (url.length>MAX_URL_CHARS)?
		url.substring(0, MAX_URL_CHARS) + "..." : url;
}
var Timeline = function ()
{
	this.milestones = [];
	this.yearColumn = document.getElementById('yearBar');
	this.columnLeft = new TimelineColumn(document.getElementById('timelineLeft'));
	this.columnRight = new TimelineColumn(document.getElementById('timelineRight'));
	this.defaultScrollTop = 0;
	this.barBottom = 0;
	this.itemBottom = 0;
	this.itemTop = 0;
	this.indicatorY = 0;
};
Timeline.prototype.addMilestone = function (milestone)
{
	var position = this.itemTop + 12;
	position = Math.max(this.barBottom, position);
	if (TYPE_AGE==milestone.getType())
	{
		var ageBox = milestone.getBox();
		ageBox.style.top = position + 'px';
		this.yearColumn.appendChild(ageBox);
		this.barBottom = position + ageBox.offsetHeight;
		this.indicatorY = position;
		this.yearColumn.style.height = (position + 160) + 'px';
		if (0==milestone.age)
		{
			this.defaultScrollTop = position;
		}
	}
	if (TYPE_YEAR==milestone.getType())
	{
		var yearBox = milestone.getBox();
		yearBox.style.top = position + 'px';
		this.yearColumn.appendChild(yearBox);
		this.indicatorY = position;
		this.barBottom = position + yearBox.offsetHeight;
	}
	if (TYPE_MILESTONE==milestone.getType())
	{
		this.milestones.push(milestone);
		var bottomLeft = this.columnLeft.getBottom();
		var bottomRight = this.columnRight.getBottom();
		// Append to shorter column
		var minY = Math.max(this.itemBottom, this.indicatorY);
		if (bottomLeft < bottomRight)
		{
			this.columnLeft.add(milestone, minY);
			Timeline.appendPointer(true, milestone);
		}
		else
		{
			this.columnRight.add(milestone, minY);
			Timeline.appendPointer(false, milestone);
		}
		var box = milestone.getBox();
		this.itemBottom = Math.min(this.columnLeft.getBottom(), this.columnRight.getBottom());
		this.itemTop = Math.max(this.columnLeft.getTop(), this.columnRight.getTop());
	}
}
Timeline.appendPointer = function (isLeft, milestone)
{
	var img = document.createElement('IMG');
	img.className = 'pointer pointer' + ((isLeft)?"Left":"Right");
	//img.src = (isLeft)?"img/pointer-left.png":"img/pointer-right.png";
	img.src = "img/pointer.png";
	img.style.top = (milestone.getBox().offsetTop+4) + 'px';
	document.getElementById('pointers').appendChild(img);
}
Timeline.prototype.getTotalHeight = function ()
{
	return Math.max(this.barBottom,Math.max(this.columnLeft.getBottom(), this.columnRight.getBottom()));
}
var TimelineColumn = function (div)
{
	this.div = div;
	this.milestones = [];
	this.indicatorPosition = 0;
};
TimelineColumn.prototype.add = function (milestone, position)
{
	this.div.appendChild(milestone.getBox());
	var bottom = this.getBottom() ;
	this.indicatorPosition = Math.max(position, bottom) + 8;
	milestone.getBox().style.top = this.indicatorPosition + 'px';
	this.milestones.push(milestone);
	
}
/*
	Return the bottom Y coordinate of the last element.
*/
TimelineColumn.prototype.getBottom = function ()
{
	if (0==this.milestones.length) return 0;
	var lastBox = this.milestones[this.milestones.length-1].getBox();
	return lastBox.offsetTop + lastBox.offsetHeight;
}
TimelineColumn.prototype.getTop = function ()
{
	if (0==this.milestones.length) return 0;
	var lastBox = this.milestones[this.milestones.length-1].getBox();
	return lastBox.offsetTop;
}

function formatDate (date)
{
	return date.getFullYear() + "-" + (date.getMonth()+1) + "-" + date.getDate();
 }

function resizeBody ()
{
	var height = window.innerHeight;
	var width = window.innerWidth;
	if (!window.innerHeight || window.innerHeight == 0)
	{
		height = document.documentElement.offsetHeight;
		width = document.documentElement.offsetWidth;
	}
	document.getElementById("introductionLayer").style.width = width + 'px';
	document.getElementById("friends").style.width = width + 'px';
	document.getElementById("loadingLayer").style.width = width + 'px';
	var articleHeight = height - 60;
	document.getElementById("article").style.height = articleHeight + 'px';
	document.getElementById("timelineWrapper").style.height = articleHeight + 'px';
}