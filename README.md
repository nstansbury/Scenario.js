Given.js
========

A natural language BDD testing framework for JavaScript:

```javascript
SCENARIO("Description").GIVEN("criteria").WHEN("criteria").THEN("criteria").AND("criteria").END();
```

It is designed so that the BDD scenarios can be written directly by BAs or developers in a natural language syntax that can be directly executed in any JavaScript environment.

The BDD scenarios can be defined and executed separately from individual scenario criteria implemented by the developers.

Each criteria is executed as a self-contained assertion, allowing developers to reuse the criteria across multiple scenarios in the same story or feature file. This allows a more natural OO coding style, with a consistant scope that doesn't rely on multiple nested closures.

Any combination of GIVENs, WHENs, THENs & ANDs can be chanined together, which are automatically executed asynchronously if 'false' is returned from the assertion. The scenario will wait for the assertion to become "truthy" or the test will fail.

An assertion can always access the state and values of previous assertions in the scenario using a 'Given/When/Then/The/If(criteria)' syntax:

```javascript
scenario.Given("criteria");	// Return the result of this assertion if it has been executed as a GIVEN
scenario.When("criteria");	// Return the result of this assertion if it has been executed as a WHEN
scenario.Then("criteria");	// Return the result of this assertion if it has been executed as a THEN
scenario.The("criteria");	// Return the result of this assertion however it has been executed
scenario.If("criteria");	// Has this assertion passed
```

Callbacks can assert a specific value asynchronously as if returned from the original assertion call:
```javascript
scenario.Assert("criteria", value);	// Assert a specific value against this criteria
```

Finally, END() takes an optional test timeout argument in m/s.


```javascript
// BDD Scenarios

SCENARIO.Reporter = new SCENARIO.HTMLReporter();


SCENARIO("Check a loaded event occurs when the page loads").
	GIVEN("a web page").
		WHEN("it is loaded").
			THEN("a document loaded event occurs").
END();


SCENARIO("Check an unloaded event occurs when the page unloads").
	GIVEN("a web page").
		AND("it is loaded").
			WHEN("it is unloaded").
				THEN("a document unloaded event occurs").
END();

```


```javascript
// Scenario Criteria

SCENARIO.Criteria = {
	"a web page" : function(){
		return window.document;
	},
	
	"it is loaded" : function(scenario){
		function event(){
			scenario.Assert("it is loaded", true);
		}
		this.Given("a web page").addEventListener("DOMContentLoaded", event, false);
		return false;
	},
	
	"a document loaded event occurs" : function(scenario){
		return scenario.If("it is loaded");
	},
	
	"it is unloaded" : function(scenario){
		return scenario.If("it is unloaded");
	},
	
	"a document unloaded event occurs" : function(scenario){
		function event(){
			scenario.Assert("it is unloaded", true);
		}
		scenario.Given("a web page").addEventListener("unloaded", event, false);
		return false;
	}
}

```

You can return any value or object in an assertion as long as it evaluates to "truthy". Though try to resist the tempation to return multiple objects in an assertion for the sake of it. It makes for more expressive & reusable tests to chain multiple GIVENS (or WHENs/THENs):

```javascript
// Avoid this:

SCENARIO("Check two things equal each other").
	GIVEN("Two things").
		THEN("ThingA should equal ThingB").
END();

SCENARIO.Criteria = {
	"Two things" : function(){
		return {
			thingA : new ThingA(),
			thingB : new ThingB()
		}
	},
	
	"Thing A should equal thing B" : function(scenario){
		return scenario.Given("Two things").thingA == scenario.Given("Two things").thingB;
	}
}


// Opt for this instead

SCENARIO("Check two things equal each other").
	GIVEN("ThingA").
		AND("ThingB").
			THEN("ThingA should equal ThingB").
END();

SCENARIO.Criteria = {
	"ThingA" : function(){
		return new ThingA();
	},
	"ThingB" : function(){
		return new ThingB();
	},
	"Thing A should equal thing B" : function(scenario){
		return scenario.Given("ThingA") == scenario.Given("ThingB");
	}
}
```

Testing Web Workers

Web worker scripts can be tested in isolation by testing each script file independently. postMessage()/onmessage() functionality can be mocked directly in the Scenario with scenario.postMessage():

```javascript
SCENARIO("A web worker posts the correct data back").
	GIVEN("a message value of 1").
		WHEN("it is posted in").
			AND("a message is sent back")
				THEN("the message value should equal 2").
END();

SCENARIO.Criteria = {
	"a message value of 1" : function(){
		return {
			value : 1
		}
	},
	"it is posted in" : function(scenario){
		function callback(message){
			scenario.Assert("a message is posted back", message);
		}
		var message = scenario.Given("a message value of 1");
		scenario.postMessage(message, callback);
		return true;
	},
	"a message is sent back" : function(scenario){
		return scenario.If("a message is sent back");
	},
	"the message value should equal 2" : function(scenario){
		var message = scenario.The("a message is posted back");
		return message.data == 2;
	}
}
```
