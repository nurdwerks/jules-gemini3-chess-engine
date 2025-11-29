/* eslint-env browser */

window.UIOptionFactory = {
  createSpinInput (min, max, defaultValue, onSendOption, name) {
    if (name === 'MultiPV' || name === 'Hash') {
      return this.createSliderInput(min, max, defaultValue, onSendOption, name)
    }
    const input = document.createElement('input')
    input.type = 'number'
    input.dataset.optionName = name
    if (min) input.min = min
    if (max) input.max = max
    if (defaultValue) input.value = defaultValue
    input.addEventListener('change', () => onSendOption(name, input.value))
    return input
  },

  createSliderInput (min, max, defaultValue, onSendOption, name) {
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.alignItems = 'center'
    container.style.gap = '10px'

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.dataset.optionName = name
    if (min) slider.min = min
    if (max) slider.max = max
    if (defaultValue) slider.value = defaultValue
    slider.style.flex = '1'
    slider.style.width = '100px'

    const number = document.createElement('input')
    number.type = 'number'
    if (min) number.min = min
    if (max) number.max = max
    if (defaultValue) number.value = defaultValue
    number.style.width = '60px'

    const update = (val) => {
      slider.value = val
      number.value = val
      onSendOption(name, val)
    }

    slider.addEventListener('input', () => {
      number.value = slider.value
    })
    slider.addEventListener('change', () => update(slider.value))
    number.addEventListener('change', () => update(number.value))

    container.appendChild(slider)
    container.appendChild(number)
    return container
  },

  createCheckInput (defaultValue, onSendOption, name) {
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.dataset.optionName = name
    if (defaultValue === 'true') input.checked = true
    input.addEventListener('change', () => onSendOption(name, input.checked))
    return input
  },

  createStringInput (defaultValue, onSendOption, name, showToast) {
    const container = document.createElement('div')
    container.style.display = 'flex'
    container.style.gap = '5px'
    container.style.flex = '1'

    const input = document.createElement('input')
    input.type = 'text'
    input.dataset.optionName = name
    if (defaultValue) input.value = defaultValue
    input.style.flex = '1'
    input.addEventListener('change', () => onSendOption(name, input.value))
    container.appendChild(input)

    if (name === 'BookFile' || name === 'UCI_NNUE_File') {
      const fileBtn = document.createElement('label')
      fileBtn.textContent = 'Upload'
      fileBtn.style.cursor = 'pointer'
      fileBtn.style.padding = '5px'
      fileBtn.style.border = '1px solid var(--grafana-border)'
      fileBtn.style.borderRadius = '4px'
      fileBtn.style.fontSize = '12px'
      fileBtn.style.backgroundColor = 'var(--grafana-input-bg)'

      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.style.display = 'none'

      fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
          const file = fileInput.files[0]
          fetch('/upload', {
            method: 'POST',
            headers: { 'x-filename': file.name },
            body: file
          })
            .then(res => res.json())
            .then(data => {
              input.value = data.path
              onSendOption(name, data.path)
              if (showToast) showToast('Upload successful', 'success')
            })
            .catch(err => {
              if (showToast) showToast('Upload failed: ' + err.message, 'error')
            })
        }
      })

      fileBtn.appendChild(fileInput)
      container.appendChild(fileBtn)
    }

    return container
  },

  createButtonInput (onSendOption, name) {
    const input = document.createElement('button')
    input.textContent = 'Trigger'
    input.addEventListener('click', () => onSendOption(name))
    return input
  },

  createComboInput (vars, defaultValue, onSendOption, name) {
    const input = document.createElement('select')
    input.dataset.optionName = name
    if (vars) {
      vars.forEach(v => {
        const opt = document.createElement('option')
        opt.value = v
        opt.textContent = v
        if (v === defaultValue) opt.selected = true
        input.appendChild(opt)
      })
    }
    input.addEventListener('change', () => onSendOption(name, input.value))
    return input
  }
}
