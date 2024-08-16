const Icons: { [icon: string]: string } = {
    tag: 'fa-solid fa-tag',
    association: 'fa-solid fa-left-right',
    connector: 'fa-solid fa-expand',
    dependency: 'fa-solid fa-long-arrow-right',
    document: 'fa-solid fa-file-lines',
    directedrelationship: 'fa-solid fa-arrow-right-long',
    element: 'fa-solid fa-border-top-left',
    property: 'fa-solid fa-circle',
    generalization: 'fa-solid fa-arrow-up-long',
    package: 'fa-regular fa-folder',
    section: 'section-icon', //"fa-file-o";
    group: 'fa-solid fa-folder',
    snapshot: 'fa-solid fa-camera',
    paragraph: 'fa-solid fa-paragraph',
    view: 'fa-solid fa-file',
    viewComposite: 'fa-solid fa-file',
    viewShared: 'fa-regular fa-file',
    viewNone: 'fa-regular fa-file',
    branch: 'fa-solid fa-code-branch',
    table: 'fa-solid fa-table',
    figure: 'fa-regular fa-image',
    diagram: 'fa-solid fa-diagram-project',
    equation: 'fa-solid fa-superscript',
    project: 'fa-solid fa-sitemap',
    org: 'fa-solid fa-warehouse',
    default: 'fa-solid fa-file-circle-question',
};

function Icon(icon: string): string {
    return Icons[icon] == null ? Icons.default : Icons[icon];
}

export default Icon;
