Scenario.js
========

A natural language BDD testing framework for JavaScript:

```javascript
SCENARIO("Description").GIVEN("criteria").WHEN("criteria").THEN("criteria").AND("criteria").END();
```

It is designed so that the BDD scenarios can be written directly by BAs or developers; in a natural language syntax that can be directly executed in any JavaScript environment.

The BDD scenarios can be written and executed separately from individual scenario criteria implemented by developers.

Any combination of GIVENs, WHENs, THENs & ANDs can be combined together to form a scenario chain.

```javascript
// BDD Scenarios

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

A scenario chain is implemented like a finite-state-machine, whose next state is not tested until all it its' previous states have passed.  Each criteria is defined and executed
as a self-contained assertion, allowing BAs and developers to reuse the criteria across multiple independent scenarios.

This permits developers a more natural OO coding style, with a consistent execution scope & context that doesn't rely on multiple nested closures.  As a result, an assertion can always
examine and change the state or value of it's own - or any other criteria in the scenario chain.

Each assertion is automatically executed asynchronously if it returns 'false'. The scenario will wait for the assertion to become "truthy" or it - and the remainder or the scenario chain will fail.

Each scenario is also executed asynchronously, allowing multiple scenarios to execute simultaneously, each with their own multiple asynchronous assertions.
A scenario can be told to "idle" by an assertion.  This allows a specific criteria to request the scenario "idle" synchronously until it completes to give exclusive access to any shared criteria.


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
        scenario.Get("a web page").addEventListener("DOMContentLoaded", event, false);
        scenario.Idle();				// Request any scenario running this criteria idle until it completes
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
        scenario.Get("a web page").addEventListener("unloaded", event, false);
        return false;
    }
}

```




You can return any value or object in an assertion as long as it evaluates to "truthy". Though try to resist the temptation to return multiple objects in an assertion for the sake of it.
It makes for more expressive & reusable tests to chain multiple GIVENS, WHENs or THENs:

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
        return scenario.Get("Two things").thingA == scenario.Get("Two things").thingB;
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
        return scenario.Get("ThingA") == scenario.Get("ThingB");
    }
}
```


**Scenario Setup**

Scenarios can be setup asynchronously before execution, just define SCENARIO.setup before calling the scenarios, call SCENARIO.ready() when you are done.
```javascript
SCENARIO.setup = function(){
	function onready(){
		SCENARIO.ready();
	}
	// Do something asynchronously to setup the scenarios
	// Load external files, whatever..
	// Call SCENARIO.ready() when you are..
	setTimeout(onready, 2000);
}

```


**Testing Web Workers**

Web worker scripts can be tested in isolation by testing each script file independently. Message posting functionality can be mocked directly in the scenario.

```javascript
SCENARIO("Ensure a web worker posts the correct message data back").
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
            // This callback is executed by the worker script calling postMessage()
            scenario.Assert("a message is sent back", message);
        }
        var message = scenario.Get("a message value of 1");
        // Scenario.postMessage() pushes a message into the worker scripts' onmessage handler
        scenario.postMessage(message, callback);
        return true;
    },
    "a message is sent back" : function(scenario){
        return scenario.If("a message is sent back");
    },
    "the message value should equal 2" : function(scenario){
        var message = scenario.Get("a message is posted back");
        return message.data == 2;
    }
}
```
