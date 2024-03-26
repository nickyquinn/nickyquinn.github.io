---
layout: posts.njk
title: Books
tags: books
draft: true
description: "A list of books I've read this in 2023."
---

# 2023 books

A list of books I've read this year.

<div class="book-list-container">
  <table>
    <thead>
      <tr>
        <th>Title</th><th>Author</th><th>Read</th><th>Category</th><th>Pages</th>
      </tr>
    </thead>
    <tbody>
      {%- for book in 2023_books -%}
      <tr>
        <td><a href="{{ book.GoodreadsURL }}">{{ book.Title }}</a></td><td>{{ book.Author }}</td><td>{{ book.Read }}</td><td>{{ book.Category }} <span class="meta-text">{{ book.SubCategory }}</span></td><td class="center">{{ book.Pages }}</td>
      </tr>
      {%- endfor -%}
    </tbody>
  </table>
</div>
