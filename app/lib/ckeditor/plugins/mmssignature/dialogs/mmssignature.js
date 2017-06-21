CKEDITOR.dialog.add('mmssignature', function(editor) {

	return {
		title: 'Edit Signature Template',
		midWidth: 200,
		minHeight: 100,
		contents: [
			{
				id: 'info',
				elements: [
					{
						id: 'name',
						type: 'text',
						label: 'Name',
						setup: function(widget) {
							this.setValue(widget.data.name);
						},
						commit: function(widget) {
							widget.setData('name', this.getValue());
						}
					},
					{
						id: 'title',
						type: 'text',
						label: 'Title',
						setup: function(widget) {
							this.setValue(widget.data.title);
						},
						commit: function(widget) {
							widget.setData('title', this.getValue());
						}
					}
				]
			}
		]
	};

});