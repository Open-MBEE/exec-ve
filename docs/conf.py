# Configuration file for the Sphinx documentation builder.

# -- Project information

project = 'OpenMBEE View Editor'
copyright = '2013-2023, OpenMBEE Open Source Community'
author = 'OpenMBEE Open Source Community'

release = '5.0.0-alpha'
version = 'v5'

# -- General configuration

extensions = [
    'sphinx.ext.duration',
    'sphinx.ext.doctest',
    'sphinx.ext.autodoc',
    'sphinx.ext.autosectionlabel',
    'sphinx.ext.autosummary',
    'sphinx.ext.intersphinx',
]

intersphinx_mapping = {
    'python': ('https://docs.python.org/3/', None),
    'sphinx': ('https://www.sphinx-doc.org/en/master/', None),
}
intersphinx_disabled_domains = ['std']

templates_path = ['_templates']

# -- Options for HTML output
numfig = True
autosectionlabel_prefix_document = True

# -- Options for EPUB output
epub_show_urls = 'footnote'


