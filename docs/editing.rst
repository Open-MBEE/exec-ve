Autosave to the browser's localStorage
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This feature automatically stores unsaved contents from any of the
CKEditors to the browser’s localStorage except for the editor on the
Comment's Modal, Proposal's Modal, Cross Reference Modal and Workspace's
description. The contents will be auto saved at a configurable interval
of 5 seconds and with the users’ consent reloaded automatically to the
editors which they belong.

These auto saved contents are automatically deleted when either one of
the following conditions is met:

1. Users press on one of the following buttons on the editor itself:

   a. save

   b. save and continue

   c. cancel: when the dialog shows up and users confirm the
      cancellation

   d. delete: when the dialog shows up and users confirm the deletion

2. Users press on one of the following buttons on the toolbar located on
   the right side of the app's layout

   a. save

   b. save and continue

   c. cancel: when the dialog shows up and users confirm the
      cancellation

   d. saveAll: This button is a little bit special because it shows up
      in two different situations.

      i.  Shows up after users click on the "Edit Element" button on the
          toolbar located on the right side of the app's layout. In this
          case, it will delete all the new auto saved contents related
          to the specific element the user is editing.

      ii. Shows up after a user modifies one or more elements on the
          page. In this case, it will delete all the new auto saved
          contents corresponding to all these elements.

When saving to a full capacity browser’s localStorage, all expired auto
saved contents will be automatically deleted to make room for new
contents.