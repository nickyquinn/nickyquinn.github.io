---
layout: posts.njk
title: Including same-solution project dependencies in NuGet packages
tags: programming,dotnet,nuget,package management,development,net core
draft: false
date: 2024-03-22
---

# Including same-solution project dependencies in NuGet packages

A regular pattern in .NET is to break software down into multiple projects within a Visual Studio solution; this helps developers visually identify separation of concerns, but it also allows parts of the code base to be different project types or languages. Another common reason may be that a solution produces more than one resulting piece of software, such as a web frontend, and an API for that frontend; in this scenario, you may have _three or more_ projects: the web project, the API project, and one or more library project containing code that's shared between the first two - these additional library projects may include things such as DTOs or "data transfer objects" - objects whose only purpose is to carry data between processes. When each project is built, each gets a copy of any shared library DLLs.

But what if one of your published outputs is a NuGet package? Things work differently here: NuGet packages do not automatically get bundled with their shared library projects, and viewing the nupkg file will reveal that it has a dependency on these projects, and that you're expected to provide them, potentially as separate NuGet packages. This is fine if you want this behaviour, but what if you don't?

In the below screenshot I've set up a three-project solution: the first is the NuGet package project, the middle is a shared project the NuGet package project will have a dependency on, and the SampleNugetConsumer is what I'll attempt to install the resulting NuGet package from the first project into:

{% image "src/assets/images/posts/nuget-project-dependencies/the_nuget_sample_project.webp", "Set up of the example NuGet project" %}

If I build this project, and look at the information for the NuGet package in the NuGet package manager, it tells me that this package has a dependency on SampleNuget.Shared:

{% image "src/assets/images/posts/nuget-project-dependencies/nuget_with_dependencies.webp", "NuGet package manager showing the package with NuGet dependencies" %}

Trying to install this NuGet package results in an error, because the dependent package is not available:

{% image "src/assets/images/posts/nuget-project-dependencies/need_nuget_dependencies.webp", "Missing dependency error" %}

By making the following additions (in red) to the NuGet package's csproj file, the shared project will be built and the resulting DLL will be made part of the NuGet package, instead of an external dependency:

{% image "src/assets/images/posts/nuget-project-dependencies/changes_to_nuget_project.webp", "Missing dependency error" %}

Now when I try to install the NuGet package, the external dependency is gone, and I can install the package, which now includes the shared project code:

{% image "src/assets/images/posts/nuget-project-dependencies/dependency_free_nuget.webp", "Installable NuGet package with no external dependencies" %}
