/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /**
     * This request is showing the unpublished DRAFT.
     *
     * Set by the middleware after the preview token checks out. Layouts read it
     * to force `noindex`: a preview served from the production domain would
     * otherwise be indexable, and search results would carry unfinished pages.
     */
    preview: boolean;
  }
}
