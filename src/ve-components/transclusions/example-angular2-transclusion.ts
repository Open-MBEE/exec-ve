// import { Component, ElementRef } from '@angular/core';

// @Component({
//   selector: 'app-my-component',
//   template: `
//     <div #container></div>
//   `
// })
// export class MyComponent {
//   constructor(private elRef: ElementRef) { }

//   ngOnInit() {
//     // Assume the API returns some HTML content
//     const htmlContent = '<p>Hello, <app-my-child name="John Doe" age="30"></app-my-child>!</p>';

//     // Search for the component tag in the HTML content
//     const componentTag = 'app-my-child';
//     const componentIndex = htmlContent.indexOf(componentTag);
//     if (componentIndex !== -1) {
//       // Parse the attributes on the component tag
//       const componentAttributes = htmlContent.slice(componentIndex + componentTag.length + '>'.length, htmlContent.indexOf('</app-my-child>'));
//       const name = this.elRef.nativeElement.getAttribute('name');
//       const age = this.elRef.nativeElement.getAttribute('age');

//       // Create a new component instance and pass the attributes as properties
//       const componentFactory = this.componentFactoryResolver.resolveComponentFactory(MyChildComponent);
//       const componentRef = componentFactory.create(this.elRef.injector);
//       componentRef.instance.name = name;
//       componentRef.instance.age = age;

//       // Replace the component tag with the component instance
//       const container = this.elRef.nativeElement.querySelector('#container');
//       const newElement = componentRef.location.nativeElement;
//       const startIndex = componentIndex - '<'.length;
//       const endIndex = htmlContent.indexOf('</app-my-child>') + '</app-my-child>'.length;
//       const before = htmlContent.slice(0, startIndex);
//       const after = htmlContent.slice(endIndex);
//       container.innerHTML = before;
//       this.renderer.appendChild(container, newElement);
//       container.innerHTML += after;
//     }
//   }
// }
