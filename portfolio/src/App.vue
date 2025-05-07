
<template>
   <div class="bg-[#547792] min-h-screen" >
    <NavBar/>
    <HeroSection/>
    
    <!-- <HeroSection></HeroSection> -->
  </div>
  </template>
<script setup>
import {defineAsyncComponent} from "vue"
import HeroSection from "@/components/HeroSection.vue"
import NavBar from "./components/NavBar.vue"
// const NavBar = defineAsyncComponent(()=>import("@/components/NavBar.vue"))
</script>



