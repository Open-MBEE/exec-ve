# Dropdown menu manager

This plugin adds the feature to describe with the help of the   CKEditor's configuration various dropdowns and populate them with desirable items.

## Configuration example

```javascript
config.dropdownmenumanager: {
          'PasteMenu': {
            items:[{
              name: 'Paste',
              command: 'paste'
             }, {
               name: 'PasteText',
               label: 'Paste as text'
               command: 'pastetext'
             }, {
               name: 'PasteFromWord',
               label: function(){ // If the menu is opened and the promise has not been resolved the menu label is equal to the name
                  return Promise.resolve(function(){
                    return 'Paste from Word'
                  });
               },
               command: 'pastefromword'
             }],
            label: {
              text: 'Paste',
              width: 45,
              visible:true //default value
            },
            iconPath: paste //You can use global icons or absolute path to the icon
          }
}
```

To add the dropdown on the toolbar use the keys in the 'config.dropdownmenumanager' object , in this case:
'PasteMenu'
