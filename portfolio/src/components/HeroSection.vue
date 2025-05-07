<template>

    <section class="relative w-full" data-aos="zoom-in-up">
        <div class = "absolute top-0 inset-x-0 h-64 flex items-start">
            
            <!-- <div class = "h-24 w-2/3 bg-gradient-to-br from-[#570cac] blur-2xl invisible opacity-40"></div>
            <div class = "h-20 w-3/5 bg-gradient-to-br from-[#670ccf] blur-2xl opqcity-40"></div> -->
        </div>
        <div class = "w-full px-5 sm:px-8 md:px-12 lg:px-8 max-w-screen-lg mx-auto relative">
            <div class = "grid lg:grid-cols-2 gap-10 xl:gap-14 relative pt-24 lg:max-w-none max-w-2xl md:max-w-3xl mx-auto">
                <div class = "lg:py - 6">
                    <div class = "text-center lg:text-left">
                        <h1 class = "pt-4 text-white font-bold text-4xl md:text-5xl lg:text-6xl">
                            Hi, I'm <span class = "text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-500"> Atai</span>
                        </h1>
                    </div>
                    <p class ="text-gray-300 pt-8 text-center lg:text-left mx-auto max-w-xl">
                        I am a third year, aspiring software engineering student.
                    </p>
                    <div class = "flex itemts-center gap-3 pt-9 flex-col sm:w-max am:max-auto lg:mx-0">
                        <button class = "px-6 md:px-7 
                        py-3 rounded-full 
                        relative group w-full 
                        sm:w-max flex justify-center">
                            <span class = "absolute inset-0 rounded-full
                            group-hover:scale-105 origin-center
                            transition-all ease-in-out bg-primary
                            border-2 border-transparent"></span>
                            <span class = "relative flex items-center justify-center text-white"> Hire me </span>
                        </button>
                        <button class = "border border-primary
                        px-6 md:px-7
                        py-3 rounded-full
                        relative group 
                        w-full sm:w-max
                        flex justify-center">
                        <div class = "hover:scale-105 transition-all ease-in-out flex justify center items-center relative">
                        </div>
                        <div class = "svg-container">
                            <svg class = "download-icon" width = "18" height = "22" viewBox = "0 0 18 22" fill = "none" xmlns = "http://www.w3.org/2000/svg"> </svg>
                        </div>
                    </button>
                            
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>
<script>
import AOS from "aos";
import "aos/dist/aos";
AOS.init()
</script>