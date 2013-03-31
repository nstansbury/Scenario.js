Given.js
========

A natural language BDD testing framework for JavaScript.

It is designed so that the BDD scenarios can be written directly by BAs or developers in a natural language syntax that can be directly executed in any JavaScript environment.

The BDD scenarios can be defined and executed separately from the individual scenario criteria implemented by the developers.

Each criteria is executed as a self-contained assertion, allowing developers to reuse the criteria across multiple scenarios.

Any combination of GIVENs, WHENs, THENs & ANDs can be chanined together, which are automatically executed asynchronously if 'false' is returned from the assertion.
The state and values of previous assertions can be accessed throughout the scenario chain using a 'Given/When/Then/If(criteria)' syntax. 


```javascript
// BDD Scenarios

GIVEN.Reporter = new GIVEN.HTMLReporter();


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

```


```javascript
// Scenario Criteria

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

```