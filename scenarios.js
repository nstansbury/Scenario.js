GIVEN.Reporter = new GIVEN.HTMLReporter();

GIVEN.Criteria = {
	"a web page" : function(){
		return window.document;
	},
	
	"it is loaded" : function(){
		var scenario = this;
		function event(){
			scenario.Assert("it is loaded", true);
		}
		this.Given("a web page").addEventListener("DOMContentLoaded", event, false);
		return false;
	},
	
	"a document loaded event occurs" : function(){
		return this.If("it is loaded");
	},
	
	"it is unloaded" : function(){
		return this.If("it is unloaded");
	},
	
	"a document unloaded event occurs" : function(){
		var scenario = this;
		function event(){
			scenario.Assert("it is unloaded", true);
		}
		this.Given("a web page").addEventListener("unloaded", event, false);
		return false;
	}
}

GIVEN.title = "Check a loaded event occurs when the page loads";
GIVEN("a web page").
	WHEN("it is loaded").
		THEN("a document loaded event occurs").
END();


GIVEN.title = "Check an unloaded event occurs when the page unloads";
GIVEN("a web page").
	AND("it is loaded").
		WHEN("it is unloaded").
			THEN("a document unloaded event occurs").
END();


GIVEN.title = "Check an playing event occurs when an HTML5 video is played";
GIVEN.Criteria = {
	"an HTML5 Video" : function(){
		var scenario = this;
		function loaded(){
			var video = document.createElement("VIDEO");
			video.src = "http://download.blender.org/peach/trailer/trailer_400p.ogg";
			document.body.appendChild(video);
			scenario.Assert("an HTML5 Video", video);
		}
		document.addEventListener("DOMContentLoaded", loaded, false);
		return false;
	},
	"play() is called" : function(When){
		this.Given("an HTML5 Video").play();
		return true;
	},
	"a play event is raised" : function(){
		var scenario = this;
		function play(){
			scenario.Assert("a play event is raised", true);
		}
		this.Given("an HTML5 Video").addEventListener("play", play, false);
	},
	"a playing event is raised" : function(){
		var scenario = this;
		function playing(){
			scenario.Assert("a playing event is raised", true);
		}
		this.Given("an HTML5 Video").addEventListener("playing", playing, false);
	}
}

GIVEN("an HTML5 Video").
	WHEN("play() is called").
		THEN("a play event is raised").
			AND("a playing event is raised").
END(2000);




