;(() => {
  "use strict";

  /**
   * @type HTMLMetaElement | null
   */
  const csrfMeta = document.querySelector('meta[name="csrf-token"]');
  const csrfToken = csrfMeta.content;
  console.log(csrfToken);

  /**
   * @type HTMLElement | null
   */
  const signupSection = document.querySelector("section.signup");

  if (signupSection) {
    handleSignupSection(signupSection)
  }

  /**
   * Handles the logic  for `account/signup.pug`.
   * @param {HTMLElement} section 
   */
  function handleSignupSection(section) {
    /**
     * @type HTMLFormElement
     */
    const signupForm = document.forms["signup-form"];
    /**
     * @type HTMLButtonElement
     */
    const reloadButton = signupForm.querySelector(".reloadcaptcha");
    /**
     * @type HTMLButtonElement
     */
    const checkButton = signupForm.querySelector(".checkcaptcha");
    /**
     * @type HTMLButtonElement
     */
    const submitButton = signupForm.querySelector('[type="submit"]')
    /**
     * @type HTMLOutputElement
     */
    const output = section.querySelector("output");
    /**
     * @type HTMLUListElement
     */
    const errorList = output.querySelector(".errorlist");

    // unhide buttons with javascript
    reloadButton.hidden = false;
    checkButton.hidden = false;
    signupForm.addEventListener("submit", handleSignup);
    reloadButton.addEventListener("click", handleCaptchaReload);
    checkButton.addEventListener("click", handleCaptchaValidation)

    /**
     * TODO: fluff it up with `fetch()`.
     * @param {Event} event 
     */
    function handleSignup(event) {
      event.preventDefault();
      submitButton.disabled = true;

      if ( output.classList.contains("errors") ) {
        output.classList.remove("errors");
        errorList.replaceChildren();
      }
      

      /**
       * @type HTMLFormElement
       */
      const form = event.target;

      // if there are validation errors
      if (validateForm(form).length !== 0) {
        output.classList.add("errors");
        const errors = validateForm(form);
        
        for (const error of errors) {
          const li = document.createElement("li");
          li.textContent = error;
          errorList.appendChild(li);
        }

        submitButton.disabled = false;
      } else {
        
        form.submit();
      }

      /**
       * - captcha must be solved
       * @param {HTMLFormElement} form
       * @returns {string[]} An array of validation error messages.
       */
      function validateForm(form) {
        const errors = [];
        const channelUrl = form.channelUrl.value;
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;
        const captcha = form.captcha.value;

        console.log(channelUrl, password, confirmPassword);

        if ( !String(channelUrl) && !/[a-zA-Z0-9]+/.test(channelUrl)) {
          errors.push("Channel name must consist only of letters, numbers and underscores (no spaces).");
        }

        if (channelUrl.length < 3 || channelUrl.length > 25) {
          errors.push("Channel name must have between 3 and 25 characters.");
        }

        if (password !== confirmPassword) {
          errors.push("Passwords must match.");
        }

        if (password.length < 4) {
          errors.push("Password must be at least 4 characters long.");
        }

        if (!String(captcha)) {
          errors.push("Something is wrong with captcha, try reloading it.")
        }

        return errors;
      }
    }

    /**
     * TODO: fix captcha misalignment.
     * @param {MouseEvent} event
     */
    async function handleCaptchaReload(event) {
      reloadButton.disabled = true;

      /**
       * @type HTMLDivElement
       */
      const container = signupForm.querySelector(".captchacontainer");
      const frag = document.createRange();

      try {
        const res = await fetch("/captcha", {
          method: "GET",
        });

        if (!res.ok) {
          throw new Error("Something is wrong with getting new captcha, try reloading again.")
        }

        const data = await res.text();
        const newCaptcha = frag.createContextualFragment(data);

        container.replaceChildren();
        container.appendChild(newCaptcha);
        
      } catch (error) {
        output.classList.add("errors")
        errorList.insertAdjacentHTML("beforeend", `<li>${error}</li>`);

      } finally {
        reloadButton.disabled = false;
        checkButton.disabled = false;
        checkButton.classList.remove("positive", "negative");
      }
    };

    /**
     * The order:
     * - User clicks on button
     * - get the value of captcha input
     * - fetch it to the `POST` `/captcha` endpoint
     * - depending on the result either throw an error 
     * - or validate it
     * @param {MouseEvent} event
     */
    async function handleCaptchaValidation(event) {
      checkButton.disabled = true;
      
      /**
       * @type HTMLInputElement
       */
      const captcha = signupForm.elements["captcha"]
      
      try {
        const headers = new Headers([
          ["x-csrf-token", `${csrfToken}`],
          ["Content-Type", "application/json"]
        ]);
        const res = await fetch("/captcha", {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ "captcha": `${captcha.value}` }),
        });

        if (!res.ok) {
          const { status, statusText } = res;
          throw Error(`${status} ${statusText}`);
        }

        const result = await res.text();

        if (result !== "success") {
          checkButton.disabled = true;
          checkButton.classList.add("negative");
          throw new Error("Failed to guess captcha")
        } else {
          checkButton.disabled = true;
          checkButton.classList.add("positive");
        }

      } catch (error) {
        const li = document.createElement("li");
        output.classList.add("errors");
        li.textContent = error;
        errorList.appendChild(li);
      }
    };
  }

  // /**
  //  * @param {HTMLDivElement} captchaWrapper 
  //  */
  // async function getCaptcha(captchaContainer) {}

  // /**
  //  * @param {HTMLInputElement} captchaInput 
  //  */
  // async function validateCaptcha(captchaInput) {}

  // /**
  //  * @param {Error | string} error
  //  * @param {HTMLOutputElement} output 
  //  * @param {string[]} errors 
  //  */
  // function handleErrors(error, output, errors = []) {}
})();