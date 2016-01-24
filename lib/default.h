/*


#include <locale.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdio.h>
#include <stdbool.h>
#include <string.h>
#include <time.h>



*/


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- locale.h -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// lconv doesn't exist
char* setlocale (int category, const char* locale);
// others don't exist, see:
//       https://developer.getpebble.com/docs/c/Standard_C/Locale/#setlocale
#define LC_ALL
#define LC_TIME

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- stdlib.h -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
//atof
int atoi(const char* buffer);
long int atol(const char* buffer);
//long long int atoll(char* buffer);
//double strtod(const char* buffer, char** endptr);
//float strtof(const char* buffer, char** endptr);
long int strtol(const char* str, char** endptr, int base);
//long double strtold(const char* str, char** endptr);
//long long int strtoll(const char* str, char** endptr, int base);
unsigned long int strtoul(const char* str, char** endptr, int base);
// unnsigned long long int strtoull(const char* str, char** endptr, int base);

int rand();
void srand(unsigned int seed);

void* calloc(size_t num, size_t size);
void free(void* ptr);
void* malloc(size_t size);
void* realloc(void* ptr, size_t size);

int atexit(void (*func)(void));
char* getenv(const char* name);

void* bsearch (const void* key, const void* base, size_t num, size_t size, int (*compar)(const void*,const void*));
void qsort (void* base, size_t num, size_t size, int (*compar)(const void*,const void*));

int abs(int n);
div_t div(int numerator, int denominator);
long int labs(long int n);
ldiv_t ldiv(long int numerator, long int denominator);
// long long int functions not defined.

int mblen(const char* pmb, size_t max);
int mbtowc (wchar_t* pwc, const char* pmb, size_t max);
int wctomb (char* pmb, wchar_t wc);

size_t mbstowcs (wchar_t* dest, const char* src, size_t max);
size_t wcstombs (char* dest, const wchar_t* src, size_t max);

#define RAND_MAX
#define NULL

typedef (!) div_t;
typedef (!) ldiv_t;
typedef (!) size_t;

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- stdint.h -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
#define INT8_MIN
#define INT8_MAX

#define INT16_MIN
#define INT16_MAX

#define INT32_MIN
#define INT32_MAX

#define INT64_MIN
#define INT64_MAX

#define UINT8_MAX
#define UINT16_MAX
#define UINT32_MAX
#define UINT64_MAX

// There's technically more, but who uses those? :P

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- stdio.h -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
//remove
//rename
//tmpfile
//tmpnam

//fclose
//fflush
//fopen
//freopen
//setbuf
//setvbuf

//fprintf
//fscanf
int printf(const char* format, ...);
// SCANF (does this exist? Don't see why it would do anything.)
int snprintf(char* buff, size_t size, const char* format, ...);
//sprintf
//sscanf
//vfprintf
//vscanf
//vsnprintf
//vsprintf
//vsscanf

//fgetc
//fgets
//fputc
//fputs
//getc
//getchar
//gets
//putc
//putchar
//puts
//ungetc

//fread
//fwrite

//fgetpos
//fseek
//fsetpos
//ftell
//rewind

//clearerr
//feof
//ferror
//perror

//BUFSIZ
//EOF
//FILENAME_MAX
//FOPEN_MAX
//L_tmpnam
//NULL
//TMP_MAX

//FILE
//fpos_t
//size_t

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- stdbool.h -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

#define true 1
#define false 0

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- string.h -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

void* memcpy (void* destination, const void* source, size_t num);
void* memmove (void* destination, const void* source, size_t num);
char* strcpy (char* destination, const char* source);
char* strncpy (char* destination, const char* source, size_t num);
char* strcat (char* destination, const char* source);
char* strncat (char* destination, const char* source, size_t num);
int memcmp (const void* ptr1, const void* ptr2, size_t num);
int strcmp (const char* str1, const char* str2);
int strcoll (const char* str1, const char* str2);
int strncmp (const char* str1, const char* str2, size_t num);
size_t strxfrm (char* destination, const char* source, size_t num);
void* memchr (void* ptr, int value, size_t num);
char* strchr (char* str, int character);
size_t strcspn (const char* str1, const char* str2);
char* strpbrk (char* str1, const char* str2);
char* strrchr (char* str, int character);
size_t strspn (const char * str1, const char * str2);
char* strstr (char* str1, const char* str2);
char* strtok (char* str, const char* delimiters);
void* memset (void* ptr, int value, size_t num);
char* strerror (int errnum);
size_t strlen (const char* str);

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- time.h -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

//clock
double difftime (time_t end, time_t beginning /* Use `end - beginning` instead! */);
time_t mktime (struct tm* tb);
time_t time (time_t* tloc);
//char* asctime (const struct tm* tb);
//char* ctime (const time_t* tloc);
struct tm* gmtime (time_t* tloc);
struct tm* localtime (time_t* tloc);
size_t strftime (char* buffer, size_t maxsize, const char* format, struct tm* tloc);

typedef (!) struct tm;
typedef (!) time_t;
