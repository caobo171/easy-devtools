# Communication architecture
- This file is used to describe some key communication in each feature of product

## Feature 1: Convert to readable date

- Listen to context menu click event => Open popup 
- In popup there's an option to open tool in sidepanel => Click to it => Send message to background
- Background listen message from popup => save the message to the local storage => open the sidepanel


### Feature 2: Screenshot

- Listen to context menu click event => It will show the popup
- After showing the popup  => Send message to background to capture the active tab
- Background listen message from content part => Capture the active tab => Send message to popup => Content part receive message => Show the screenshot in the popup
- In the popup there's an option to open tool in sidepanel => Click to it => Send message to background


### Feature 3: Video recording