SCENARIO.setup = function(){
	function onready(){
		SCENARIO.ready();
	}
	// Do something asynchronously to setup the scenarios
	setTimeout(onready, 1000);
}

SCENARIO.Criteria = {
	"a web page" : function(){
		return window.document;
	},
	
	"it is loaded" : function(scenario){
		var doc = scenario.Get("a web page");
		
		function onComplete(){
			if(doc.readyState == "complete"){
				scenario.Assert("it is loaded", true);
				return true;
			}
			return false;
		}
		if(onComplete()){
			return true;
		}
		else {
			doc.addEventListener("readystatechange", onComplete, false);
			return false;
		}
	},
	
	"a document loaded event occurs" : function(scenario){
		return scenario.If("it is loaded");
	},
	
	"it is unloaded" : function(scenario){
		return scenario.If("it is unloaded");
	},
	
	"a document unload event occurs" : function(scenario){
		function event(){
			scenario.Assert("it is unloaded", true);
		}
		scenario.Get("a web page").addEventListener("unload", event, false);
		return false;
	}
}


SCENARIO("Check a loaded event occurs when the page loads").
	GIVEN("a web page").
		WHEN("it is loaded").
			THEN("a document loaded event occurs").
END();


SCENARIO("Check an unloaded event occurs when the page unloads").
	GIVEN("a web page").
		AND("it is loaded").
			WHEN("it is unloaded").
				THEN("a document unload event occurs").
END();



SCENARIO.Criteria = {
	"an HTML5 Video" : function(scenario){
		function onComplete(){
			if(document.readyState == "complete"){
				var video = document.createElement("VIDEO");
				video.src = "http://download.blender.org/peach/trailer/trailer_400p.ogg";
				document.body.appendChild(video);
				scenario.Assert("an HTML5 Video", video);
				return true;
			}
			return false;
		}
		if(onComplete()){
			return true;
		}
		else {
			document.addEventListener("readystatechange", onComplete, false);
			return false;
		}
	},
	
	"a play event listener" : function(scenario){
		function play(){
			scenario.Assert("the play listener is called", true);
		}
		scenario.Get("an HTML5 Video").addEventListener("play", play, false);
		return true;
	},
	
	"a playing event listener" : function(scenario){
		function playing(){
			scenario.Assert("the playing listener is called", true);
		}
		scenario.Get("an HTML5 Video").addEventListener("playing", playing, false);
		return true;
	},
	
	"play() is called" : function(scenario){
		scenario.Get("an HTML5 Video").play();
		return true;
	},
	"the play listener is called" : function(scenario){
		return this.result;
	},
	"the playing listener is called" : function(scenario){
		return this.result;
	}
}


SCENARIO("Check a playing and a play event occurs when an HTML5 video is played").
	GIVEN("an HTML5 Video").
		AND("a play event listener").
		AND("a playing event listener").
			WHEN("play() is called").
				THEN("the play listener is called").
					AND("the playing listener is called").
END();


SCENARIO("Demonstrate that a scenario with no criteria implemented still correctly executes").
	GIVEN("one thing").
		AND("another").
			WHEN("something happens").
				THEN("this").
					AND("and that should occur").
END();


SCENARIO("Demonstrate a scenario can be defined like a 'To-Do' with no criteria specified").
END();
