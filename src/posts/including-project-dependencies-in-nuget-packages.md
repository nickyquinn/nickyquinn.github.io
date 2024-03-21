---
layout: posts.njk
title: Including same-solution project dependencies in NuGet packages
tags: programming,dotnet,nuget,package management,development,net core
draft: true
---

# Including same-solution project dependencies in NuGet packages

A regular pattern in .NET is to break software down into multiple projects within a Visual Studio solution; this helps developers visually identify separation of concerns, but it also allows parts of the code base to be different project types or languages. Another common reason may be that a solution produces more than one resulting piece of software, such as a web frontend, and an API for that frontend; in this scenario, you may have _three or more_ projects: the web project, the API project, and one or more library project containing code that's shared between the first two - these additional library projects may include things such as DTOs or "data transfer objects" - objects whose only purpose is to carry data between processes. When each project is built, each gets a copy of any shared library DLLs.

But what if one of your published outputs is a NuGet package? Things work differently here: NuGet packages do not automatically get bundled with their shared library projects, and viewing the nupkg file will reveal that it has a dependency on these projects, and that you're expected to provide them, potentially as separate NuGet packages. This is fine if you want this behaviour, but what if you don't?
