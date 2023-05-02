# Configuration file for the Sphinx documentation builder.

# -- Project information

project = 'OpenMBEE View Editor'
copyright = '2013-2023, OpenMBEE Open Source Community'
author = 'OpenMBEE Open Source Community'

release = '0.1'
version = '5.0.0'

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


#these are enforced by rstdoc, but keep them for sphinx-build
numfig = 0
smartquotes = 0
source_suffix = '.rst'
templates_path = []
language = None
highlight_language = "none"
default_role = 'math'
pygments_style = 'sphinx'
exclude_patterns = ['_build', 'Thumbs.db', '.DS_Store']
master_doc = 'index'
html_extra_path=['doc/_traceability_file.svg'] #relative to
