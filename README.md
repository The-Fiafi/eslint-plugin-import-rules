# eslint-plugin-import-rules-pack

This plugin will help with writing sorted imports in your code

## Installation

You can can install this plugin with npm

```bash
  npm install -D eslint-plugin-import-rules-pack
```

and add this to your eslint config file:

```json
{
    "plugins": ["import-rule"],
    "rules": {
        "import-rule/semicolon-after-import": "warn",
        "import-rule/import-combination": "warn"
    }
}
```
    
## Usage/Examples

This plugin includes two rules for imports: ```import-combination``` and ```semicolon-after-import```

### import-combination

import-combination will help you with sorting imports according to the following structure:
  - Hooks
  - Custom function and helpers
  - Styles
  - Components

#### Unsorted example

```javascript
import "animate.css";
import React from "react";
import Background from "./components/Background";
import Form from "./components/Form";
import "./App.scss";
import Button from "/components/Button";
import store from "store";
import { useStoreThink } from "store";
import storeHelper from "store/helpers";
```

#### Sorted after fixing with import-combination rule 

```javascript
import React from "react"; // Hooks 
import { useStoreThink } from "store";

import store from "store"; // Custom function and helpers
import storeHelper from "store/helpers"; 

import "animate.css"; // Styles
import "./App.scss"; 

import Background from "./components/Background"; // Components
import Form from "./components/Form";
import Button from "/components/Button";
```

It also further sorts the user-defined functions by logically separating them by path while keeping the comments associated with those imports:

#### Unsorted example

```javascript
import "animate.css";
import React from "react";
// this is ideal background
import Background from "./components/Background";
import Form from "./components/Form";
import "./App.scss";
// perfect button 
import Button from "/components/Button";
import store from "store";
import { useStoreThink } from "store";
import storeHelper from "store/helpers";

import ElseComponent from "else"
import ElseComponent2 from "else/second"
import helper from "helper"
import helper2 from "helper/second"
```

#### Sorted after fixing with import-combination rule 

```javascript
import React from "react";
import { useStoreThink } from "store"; // Hooks

import store from "store";
import storeHelper from "store/helpers"; // Custom function and helpers

import helper from "helper"
import helper2 from "helper/second" // This custom function and helpers too 

import "animate.css";
import "./App.scss"; // Styles 

// this is ideal background
import Background from "./components/Background";
import Form from "./components/Form";
// perfect button 
import Button from "/components/Button"; // Components
import ElseComponent from "else"
import ElseComponent2 from "else/second" // This components too
```

### semicolon-after-import

This rule watches for semicolons after imports:

#### Unchanged example

```javascript
import some from "some"
```

#### Modified example

```javascript
import some from "some";
```
